import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendWhatsAppMessage,
  generateBookingCompletedMessage,
  generateBookingCancelledMessage,
} from "@/lib/whatsapp";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        shop: true,
        service: true,
        barber: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Get booking error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get current booking
    const currentBooking = await prisma.booking.findUnique({
      where: { id },
      include: { shop: true, service: true, barber: true },
    });

    if (!currentBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Update booking
    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        shop: true,
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

    // Send WhatsApp notification for status changes
    try {
      const formattedPhone = booking.customerPhone.startsWith("0")
        ? "62" + booking.customerPhone.slice(1)
        : booking.customerPhone;

      // Get service/package name
      const itemName = booking.service?.name || booking.package?.name || "Layanan";

      if (status === "COMPLETED") {
        await sendWhatsAppMessage({
          target: formattedPhone,
          message: generateBookingCompletedMessage({
            customerName: booking.customerName,
            shopName: booking.shop.name,
            serviceName: itemName,
          }),
        });
      } else if (status === "CANCELLED") {
        const { format } = await import("date-fns");
        const { id: localeId } = await import("date-fns/locale");

        await sendWhatsAppMessage({
          target: formattedPhone,
          message: generateBookingCancelledMessage({
            customerName: booking.customerName,
            shopName: booking.shop.name,
            date: format(booking.bookingDate, "EEEE, d MMMM yyyy", { locale: localeId }),
            time: booking.bookingTime,
          }),
        });
      }
    } catch (waError) {
      console.error("WhatsApp notification failed:", waError);
      // Continue even if WhatsApp fails
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.booking.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete booking error:", error);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}