import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyQStashSignature } from "@/lib/qstash-verify";
import {
  sendWhatsAppMessage,
  generateBookingReminderMessage,
} from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    // Get request body as text for signature verification
    const body = await request.text();

    // Parse JSON with proper error handling
    let bookingId: string;
    try {
      const parsed = JSON.parse(body);
      bookingId = parsed.bookingId;
    } catch {
      console.error("[QStash] Invalid JSON payload");
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Verify QStash signature
    const signature = request.headers.get("upstash-signature");
    if (!signature) {
      console.error("[QStash] Missing signature header");
      return NextResponse.json(
        { error: "Unauthorized - missing signature" },
        { status: 401 }
      );
    }

    const isValid = await verifyQStashSignature(signature, body);
    if (!isValid) {
      console.error("[QStash] Invalid signature");
      return NextResponse.json(
        { error: "Unauthorized - invalid signature" },
        { status: 401 }
      );
    }

    // Validate bookingId
    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 }
      );
    }

    // Fetch booking with related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
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
    });

    if (!booking) {
      console.error(`[QStash] Booking ${bookingId} not found`);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if reminder already sent
    if (booking.reminderSent) {
      console.log(`[QStash] Reminder already sent for booking ${bookingId}`);
      return NextResponse.json({
        success: true,
        message: "Reminder already sent",
      });
    }

    // Only send reminders for PENDING or CONFIRMED bookings
    if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
      console.log(
        `[QStash] Skipping reminder for booking ${bookingId} with status ${booking.status}`
      );
      return NextResponse.json({
        success: true,
        message: `Reminder skipped - booking status is ${booking.status}`,
      });
    }

    // Get service/package name
    const itemName = booking.service?.name || booking.package?.name || "Layanan";

    // Generate reminder message
    const message = generateBookingReminderMessage({
      customerName: booking.customerName,
      shopName: booking.shop.name,
      serviceName: itemName,
      time: booking.bookingTime,
    });

    // Format phone number (remove leading 0, add 62)
    const formattedPhone = booking.customerPhone.startsWith("0")
      ? "62" + booking.customerPhone.slice(1)
      : booking.customerPhone;

    // Send WhatsApp reminder
    const waResult = await sendWhatsAppMessage({
      target: formattedPhone,
      message,
    });

    if (waResult.status) {
      // Update booking to mark reminder as sent
      await prisma.booking.update({
        where: { id: bookingId },
        data: { reminderSent: true },
      });

      console.log(`[QStash] Reminder sent successfully for booking ${bookingId}`);
      return NextResponse.json({
        success: true,
        message: "Reminder sent successfully",
      });
    } else {
      console.error(
        `[QStash] Failed to send reminder for booking ${bookingId}:`,
        waResult.reason
      );
      return NextResponse.json(
        { error: "Failed to send WhatsApp message", reason: waResult.reason },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[QStash] Send reminder error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}