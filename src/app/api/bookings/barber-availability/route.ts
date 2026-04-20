import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barberId = searchParams.get("barberId");
    const date = searchParams.get("date");

    if (!barberId || !date) {
      return NextResponse.json(
        { error: "Barber ID and date are required" },
        { status: 400 }
      );
    }

    // Parse date as local date (YYYY-MM-DD format)
    // The frontend sends dates in local format, not ISO UTC
    const [year, month, day] = date.split("-").map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        barberId,
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

    // Convert bookings to blocked time ranges (in minutes from midnight)
    const blockedSlots = bookings.map((booking) => {
      const startMinutes =
        parseInt(booking.bookingTime.split(":")[0]) * 60 +
        parseInt(booking.bookingTime.split(":")[1]);
      const duration =
        booking.service?.duration || booking.package?.duration || 60;
      const endMinutes = startMinutes + duration;

      return {
        start: startMinutes,
        end: endMinutes,
        bookingId: booking.id,
      };
    });

    return NextResponse.json({ blockedSlots });
  } catch (error) {
    console.error("Get barber availability error:", error);
    return NextResponse.json(
      { error: "Failed to fetch barber availability" },
      { status: 500 }
    );
  }
}