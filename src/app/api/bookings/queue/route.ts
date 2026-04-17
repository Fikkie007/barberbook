import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
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

    // Fetch active bookings for queue display (PENDING and CONFIRMED are active)
    const activeStatuses: BookingStatus[] = [BookingStatus.PENDING, BookingStatus.CONFIRMED];
    const activeBookings = await prisma.booking.findMany({
      where: {
        shopId,
        bookingDate: { gte: targetDate, lte: endDate },
        status: { in: activeStatuses },
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

    // Fetch all bookings for stats (separate query, minimal data)
    const allBookings = await prisma.booking.findMany({
      where: {
        shopId,
        bookingDate: { gte: targetDate, lte: endDate },
      },
      select: { status: true },
    });

    const queue = activeBookings.map((booking, index) => {
      // Get service/package name
      let serviceName: string;
      if (booking.package) {
        serviceName = booking.package.name;
      } else if (booking.service) {
        serviceName = booking.service.name;
      } else {
        serviceName = "Layanan";
      }

      return {
        id: booking.id,
        queuePosition: index + 1,
        customerName: booking.customerName,
        bookingTime: booking.bookingTime,
        serviceName,
        barberName: booking.barber?.name || null,
        status: booking.status,
        notes: booking.notes,
      };
    });

    // Calculate stats from all bookings
    const stats = {
      total: allBookings.length,
      pending: allBookings.filter((b) => b.status === BookingStatus.PENDING).length,
      confirmed: allBookings.filter((b) => b.status === BookingStatus.CONFIRMED).length,
      completed: allBookings.filter((b) => b.status === BookingStatus.COMPLETED).length,
      cancelled: allBookings.filter((b) => b.status === BookingStatus.CANCELLED).length,
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