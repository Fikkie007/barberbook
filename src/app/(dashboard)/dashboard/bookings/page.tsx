import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BookingsClient from "@/components/dashboard/bookings-client";
import { getUserShops, getActiveShopId } from "@/lib/shop-helpers";

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

  // Get user's shops based on role
  const shops = await getUserShops(session.user.id, session.user.role);

  // Get active shop ID
  const activeShopId = await getActiveShopId(
    session.user.id,
    session.user.role,
    selectedShopId,
  );

  // OWNER must select a shop first
  if (!activeShopId) {
    if (session.user.role === "OWNER" && shops.length > 0) {
      return (
        <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold text-white">Pilih Toko</h2>
          <p className="mt-2 text-slate-400">
            Silakan pilih toko dari sidebar untuk melihat booking.
          </p>
        </div>
      );
    }
    redirect("/dashboard");
  }

  // Build filter for bookings query
  const where: Record<string, unknown> = { shopId: activeShopId };
  if (
    selectedStatus &&
    ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(selectedStatus)
  ) {
    where.status = selectedStatus;
  }

  // Get bookings, services, packages, barbers, shop data, and status counts
  const [bookings, services, packages, barbers, shop, statusCounts] = await Promise.all([
    // Bookings
    prisma.booking.findMany({
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
      orderBy: [{ bookingDate: "desc" }, { bookingTime: "desc" }],
    }),
    // Services
    prisma.service.findMany({
      where: { shopId: activeShopId, isActive: true },
      select: { id: true, name: true, price: true, duration: true },
      orderBy: { sortOrder: "asc" },
    }),
    // Packages
    prisma.servicePackage.findMany({
      where: { shopId: activeShopId, isActive: true },
      include: {
        services: {
          orderBy: { sortOrder: "asc" },
          include: {
            service: {
              select: { id: true, name: true, price: true, duration: true },
            },
          },
        },
      },
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
    // Status counts for filter tabs
    prisma.booking.groupBy({
      by: ["status"],
      where: { shopId: activeShopId },
      _count: true,
    }),
  ]);

  const countsMap = {
    PENDING: 0,
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    total: 0,
  };
  for (const item of statusCounts) {
    countsMap[item.status as keyof typeof countsMap] = item._count;
    countsMap.total += item._count;
  }

  return (
    <BookingsClient
      shopId={activeShopId}
      initialBookings={bookings}
      statusCounts={countsMap}
      services={services}
      packages={packages}
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
