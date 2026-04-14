import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendWhatsAppMessage,
  generateBookingConfirmationMessage,
  generateBookingReminderMessage,
} from "@/lib/whatsapp";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Simple auth via header or query param
const CRON_SECRET = process.env.CRON_SECRET;

function authenticate(request: NextRequest): boolean {
  // Check Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${CRON_SECRET}`) {
    return true;
  }

  // Check query param as fallback
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (CRON_SECRET && token === CRON_SECRET) {
    return true;
  }

  // Allow if no CRON_SECRET is configured (dev mode)
  if (!CRON_SECRET) {
    console.warn("[Cron] CRON_SECRET not configured - allowing request");
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  // Authenticate
  if (!authenticate(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    confirmations: { sent: 0, failed: 0 },
    reminders: { sent: 0, failed: 0 },
  };

  try {
    const now = new Date();

    // 1. Process pending confirmations (bookings created but confirmation not sent)
    const pendingConfirmations = await prisma.booking.findMany({
      where: {
        confirmationSent: false,
        whatsappSent: false,
        status: { in: ["PENDING", "CONFIRMED"] },
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
        shop: true,
      },
      take: 50, // Limit batch size
    });

    for (const booking of pendingConfirmations) {
      const formattedPhone = booking.customerPhone.startsWith("0")
        ? "62" + booking.customerPhone.slice(1)
        : booking.customerPhone;

      // Get service/package name
      const itemName = booking.service?.name || booking.package?.name || "Layanan";
      const itemPrice = booking.service?.price || booking.package?.price || 0;

      const message = generateBookingConfirmationMessage({
        customerName: booking.customerName,
        shopName: booking.shop.name,
        serviceName: itemName,
        barberName: booking.barber?.name,
        date: format(booking.bookingDate, "EEEE, d MMMM yyyy", { locale: id }),
        time: booking.bookingTime,
        servicePrice: booking.servicePrice || itemPrice,
        tipAmount: booking.tipAmount || 0,
        totalPrice: booking.totalPrice || itemPrice,
      });

      const result = await sendWhatsAppMessage({
        target: formattedPhone,
        message,
      });

      if (result.status) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            whatsappSent: true,
            confirmationSent: true,
          },
        });
        results.confirmations.sent++;
        console.log(`[Cron] Confirmation sent for booking ${booking.id}`);
      } else {
        results.confirmations.failed++;
        console.error(
          `[Cron] Failed to send confirmation for booking ${booking.id}:`,
          result.reason
        );
      }
    }

    // 2. Process pending reminders (bookings within 24 hours, reminder not sent)
    const reminderWindowStart = now;
    const reminderWindowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const pendingReminders = await prisma.booking.findMany({
      where: {
        reminderSent: false,
        status: { in: ["PENDING", "CONFIRMED"] },
        bookingDate: {
          gte: reminderWindowStart,
          lte: reminderWindowEnd,
        },
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
        shop: true,
      },
      take: 50, // Limit batch size
    });

    for (const booking of pendingReminders) {
      // Check if the booking time is within 24 hours
      const [hours, minutes] = booking.bookingTime.split(":").map(Number);
      const appointmentDateTime = new Date(booking.bookingDate);
      appointmentDateTime.setHours(hours, minutes, 0, 0);

      const hoursUntilAppointment =
        (appointmentDateTime.getTime() - now.getTime()) / (60 * 60 * 1000);

      // Only send reminder if appointment is within 24 hours
      if (hoursUntilAppointment > 0 && hoursUntilAppointment <= 24) {
        const formattedPhone = booking.customerPhone.startsWith("0")
          ? "62" + booking.customerPhone.slice(1)
          : booking.customerPhone;

        // Get service/package name
        const itemName = booking.service?.name || booking.package?.name || "Layanan";

        const message = generateBookingReminderMessage({
          customerName: booking.customerName,
          shopName: booking.shop.name,
          serviceName: itemName,
          time: booking.bookingTime,
        });

        const result = await sendWhatsAppMessage({
          target: formattedPhone,
          message,
        });

        if (result.status) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { reminderSent: true },
          });
          results.reminders.sent++;
          console.log(`[Cron] Reminder sent for booking ${booking.id}`);
        } else {
          results.reminders.failed++;
          console.error(
            `[Cron] Failed to send reminder for booking ${booking.id}:`,
            result.reason
          );
        }
      }
    }

    console.log("[Cron] Job completed:", results);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error("[Cron] Job failed:", error);
    return NextResponse.json(
      { error: "Cron job failed", results },
      { status: 500 }
    );
  }
}