import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");
    const date = searchParams.get("date");

    if (!shopId) {
      return NextResponse.json({ error: "Shop ID required" }, { status: 400 });
    }

    // Default to today if no date provided
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        shopId,
        bookingDate: { gte: targetDate, lte: endDate },
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
      orderBy: [{ bookingTime: "asc" }],
    });

    // Calculate queue position (only for non-completed/cancelled bookings)
    const activeStatuses = ["PENDING", "CONFIRMED"];
    const activeBookings = bookings.filter((b) => activeStatuses.includes(b.status));

    const queue = bookings.map((booking, index) => {
      // Get service/package name
      let serviceName: string;
      if (booking.package) {
        serviceName = booking.package.name;
      } else if (booking.service) {
        serviceName = booking.service.name;
      } else {
        serviceName = "Layanan";
      }

      // Calculate queue position only for active bookings
      const queuePosition = activeStatuses.includes(booking.status)
        ? activeBookings.findIndex((b) => b.id === booking.id) + 1
        : null;

      return {
        id: booking.id,
        queuePosition,
        customerName: booking.customerName,
        bookingTime: booking.bookingTime,
        serviceName,
        barberName: booking.barber?.name || null,
        status: booking.status,
        notes: booking.notes,
      };
    });

    // Calculate stats
    const stats = {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "PENDING").length,
      confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
      completed: bookings.filter((b) => b.status === "COMPLETED").length,
      cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
    };

    return NextResponse.json({
      success: true,
      queue,
      stats,
      date: format(targetDate, "yyyy-MM-dd"),
    });
  } catch (error) {
    console.error("Get queue error:", error);
    return NextResponse.json({ error: "Failed to fetch queue" }, { status: 500 });
  }
}