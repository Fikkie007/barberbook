import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendWhatsAppMessage,
  generateBookingConfirmationMessage,
} from "@/lib/whatsapp";
import { scheduleBookingReminder, calculateReminderTime } from "@/lib/qstash";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      shopId,
      serviceId,
      packageId,
      barberId,
      customerName,
      customerPhone,
      customerEmail,
      bookingDate,
      bookingTime,
      notes,
      tipAmount,
      source,
    } = body;

    // Validate required fields - must have either serviceId OR packageId
    if (!shopId || !customerName || !customerPhone || !bookingDate || !bookingTime) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    if (!serviceId && !packageId) {
      return NextResponse.json(
        { error: "Layanan atau paket harus dipilih" },
        { status: 400 }
      );
    }

    if (serviceId && packageId) {
      return NextResponse.json(
        { error: "Pilih layanan atau paket, tidak boleh kedua-duanya" },
        { status: 400 }
      );
    }

    // Verify shop exists and is active
    const shop = await prisma.shop.findFirst({
      where: { id: shopId, isActive: true },
      include: {
        services: serviceId ? { where: { id: serviceId } } : false,
        packages: packageId ? { where: { id: packageId }, include: { services: { include: { service: true } } } } : false,
        barbers: barberId ? { where: { id: barberId } } : false,
      },
    });

    if (!shop) {
      return NextResponse.json({ error: "Toko tidak ditemukan" }, { status: 404 });
    }

    // Validate service or package
    let servicePrice: number;
    let serviceName: string;
    let duration: number;

    if (serviceId) {
      if (shop.services.length === 0) {
        return NextResponse.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
      }
      servicePrice = shop.services[0].price;
      serviceName = shop.services[0].name;
      duration = shop.services[0].duration;
    } else if (packageId) {
      if (!shop.packages || shop.packages.length === 0) {
        return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
      }
      const pkg = shop.packages[0];
      servicePrice = pkg.price;
      serviceName = pkg.name;
      duration = pkg.duration;
    } else {
      return NextResponse.json({ error: "Layanan tidak valid" }, { status: 400 });
    }

    // Validate barberId - must be null if not specified
    const validBarberId = barberId && barberId !== "" ? barberId : null;

    // If barberId is provided, verify it exists for this shop
    if (validBarberId) {
      const barber = await prisma.barber.findFirst({
        where: { id: validBarberId, shopId },
      });
      if (!barber) {
        return NextResponse.json(
          { error: "Barber tidak ditemukan" },
          { status: 404 }
        );
      }

      // Check for conflicting bookings for this barber
      // Parse booking date from ISO string to get local date components
      const bookingDateLocal = new Date(bookingDate);
      const year = bookingDateLocal.getFullYear();
      const month = bookingDateLocal.getMonth();
      const day = bookingDateLocal.getDate();
      const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

      const existingBookings = await prisma.booking.findMany({
        where: {
          barberId: validBarberId,
          bookingDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        include: {
          service: true,
          package: true,
        },
      });

      // Convert requested time to minutes
      const requestedMinutes =
        parseInt(bookingTime.split(":")[0]) * 60 +
        parseInt(bookingTime.split(":")[1]);
      const requestedEndMinutes = requestedMinutes + duration;

      // Check for overlap with each existing booking
      for (const existing of existingBookings) {
        const existingMinutes =
          parseInt(existing.bookingTime.split(":")[0]) * 60 +
          parseInt(existing.bookingTime.split(":")[1]);
        const existingDuration =
          existing.service?.duration || existing.package?.duration || 60;
        const existingEndMinutes = existingMinutes + existingDuration;

        // Overlap: new starts before existing ends AND new ends after existing starts
        if (
          requestedMinutes < existingEndMinutes &&
          requestedEndMinutes > existingMinutes
        ) {
          return NextResponse.json(
            {
              error:
                "Barber memiliki jadwal booking pada waktu tersebut. Pilih waktu lain atau barber berbeda.",
            },
            { status: 409 }
          );
        }
      }
    }

    // Determine booking source - default to ONLINE if not specified
    const bookingSource = source === "OFFLINE" ? "OFFLINE" : "ONLINE";

    // Calculate pricing
    const tip = tipAmount || 0;
    const totalPrice = servicePrice + tip;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        shopId,
        serviceId: serviceId || null,
        packageId: packageId || null,
        barberId: validBarberId,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        bookingDate: new Date(bookingDate),
        bookingTime,
        notes: notes || null,
        servicePrice,
        tipAmount: tip,
        totalPrice,
        status: "PENDING",
        source: bookingSource,
      },
      include: {
        service: true,
        package: {
          include: {
            services: {
              include: {
                service: true,
              },
            },
          },
        },
        barber: true,
      },
    });

    // Send WhatsApp notification
    try {
      // Get the service/package name for the message
      let itemNames: string[];
      if (booking.package) {
        itemNames = booking.package.services.map(ps => ps.service.name);
      } else {
        itemNames = [serviceName];
      }

      const message = generateBookingConfirmationMessage({
        customerName: booking.customerName,
        shopName: shop.name,
        serviceName: itemNames.join(", "),
        barberName: booking.barber?.name,
        date: format(booking.bookingDate, "EEEE, d MMMM yyyy", { locale: id }),
        time: booking.bookingTime,
        servicePrice: booking.servicePrice,
        tipAmount: booking.tipAmount,
        totalPrice: booking.totalPrice,
      });

      // Format phone number (remove leading 0, add country code)
      const formattedPhone = customerPhone.startsWith("0")
        ? "62" + customerPhone.slice(1)
        : customerPhone;

      const waResult = await sendWhatsAppMessage({
        target: formattedPhone,
        message,
      });

      if (waResult.status) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { whatsappSent: true, confirmationSent: true },
        });
      }
    } catch (waError) {
      console.error("WhatsApp notification failed:", waError);
      // Continue even if WhatsApp fails
    }

    // Schedule WhatsApp reminder 24 hours before appointment
    try {
      const reminderTime = calculateReminderTime(
        booking.bookingDate,
        booking.bookingTime
      );

      if (reminderTime) {
        const qstashMessageId = await scheduleBookingReminder(
          booking.id,
          reminderTime
        );

        if (qstashMessageId) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { qstashMessageId },
          });
        }
      } else {
        console.log(
          `[QStash] Booking ${booking.id} is less than 24 hours away - no reminder scheduled`
        );
      }
    } catch (qstashError) {
      console.error("[QStash] Failed to schedule reminder:", qstashError);
      // Continue - don't fail booking creation if scheduling fails
    }

    return NextResponse.json({
      success: true,
      message: "Booking berhasil dibuat",
      booking: {
        id: booking.id,
        customerName: booking.customerName,
        serviceName: booking.package ? booking.package.name : (booking.service?.name || serviceName),
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat booking" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    if (!shopId) {
      return NextResponse.json({ error: "Shop ID required" }, { status: 400 });
    }

    const where: Record<string, unknown> = { shopId };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.bookingDate = { gte: startDate, lte: endDate };
    }

    if (status) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        service: true,
        package: {
          include: {
            services: {
              include: {
                service: true,
              },
            },
          },
        },
        barber: true,
      },
      orderBy: [{ bookingDate: "asc" }, { bookingTime: "asc" }],
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}