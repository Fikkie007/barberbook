import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BookingsClient from "@/components/dashboard/bookings-client";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string; status?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const selectedShopId = params.shop;
  const selectedStatus = params.status;

  // Get user's shops
  const shops = await prisma.shop.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true },
  });

  if (shops.length === 0) {
    redirect("/dashboard");
  }

  const activeShopId = selectedShopId || shops[0].id;

  // Build filter
  const where: Record<string, unknown> = { shopId: activeShopId };
  if (selectedStatus && ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(selectedStatus)) {
    where.status = selectedStatus;
  }

  // Get bookings, services, barbers, and shop data
  const [bookings, services, barbers, shop] = await Promise.all([
    // Bookings
    prisma.booking.findMany({
      where,
      include: { service: true, barber: true },
      orderBy: [{ bookingDate: "desc" }, { bookingTime: "desc" }],
    }),
    // Services
    prisma.service.findMany({
      where: { shopId: activeShopId, isActive: true },
      select: { id: true, name: true, price: true, duration: true },
      orderBy: { sortOrder: "asc" },
    }),
    // Barbers
    prisma.barber.findMany({
      where: { shopId: activeShopId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    // Shop data (hours and working days)
    prisma.shop.findUnique({
      where: { id: activeShopId },
      select: {
        openingTime: true,
        closingTime: true,
        workingDays: {
          select: { dayOfWeek: true, isOpen: true },
        },
      },
    }),
  ]);

  return (
    <BookingsClient
      shopId={activeShopId}
      initialBookings={bookings}
      services={services}
      barbers={barbers}
      workingDays={shop?.workingDays || []}
      shopHours={{
        openingTime: shop?.openingTime || "09:00",
        closingTime: shop?.closingTime || "21:00",
      }}
      selectedStatus={selectedStatus}
    />
  );
}