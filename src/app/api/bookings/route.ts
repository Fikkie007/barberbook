import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendWhatsAppMessage,
  generateBookingConfirmationMessage,
} from "@/lib/whatsapp";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      shopId,
      serviceId,
      barberId,
      customerName,
      customerPhone,
      customerEmail,
      bookingDate,
      bookingTime,
      notes,
      totalPrice,
    } = body;

    // Validate required fields
    if (!shopId || !serviceId || !customerName || !customerPhone || !bookingDate || !bookingTime) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    // Verify shop exists and is active
    const shop = await prisma.shop.findFirst({
      where: { id: shopId, isActive: true },
      include: {
        services: { where: { id: serviceId } },
        barbers: barberId ? { where: { id: barberId } } : false,
      },
    });

    if (!shop) {
      return NextResponse.json({ error: "Toko tidak ditemukan" }, { status: 404 });
    }

    if (shop.services.length === 0) {
      return NextResponse.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
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
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        shopId,
        serviceId,
        barberId: validBarberId,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        bookingDate: new Date(bookingDate),
        bookingTime,
        notes: notes || null,
        totalPrice: totalPrice || shop.services[0].price,
        status: "PENDING",
      },
      include: {
        service: true,
        barber: true,
      },
    });

    // Send WhatsApp notification
    try {
      const message = generateBookingConfirmationMessage({
        customerName: booking.customerName,
        shopName: shop.name,
        serviceName: booking.service.name,
        barberName: booking.barber?.name,
        date: format(booking.bookingDate, "EEEE, d MMMM yyyy", { locale: id }),
        time: booking.bookingTime,
        price: booking.totalPrice,
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

    return NextResponse.json({
      success: true,
      message: "Booking berhasil dibuat",
      booking: {
        id: booking.id,
        customerName: booking.customerName,
        serviceName: booking.service.name,
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