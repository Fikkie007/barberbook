import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BookingTable from "@/components/dashboard/booking-table";

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

  // Get bookings
  const bookings = await prisma.booking.findMany({
    where,
    include: { service: true, barber: true },
    orderBy: [{ bookingDate: "desc" }, { bookingTime: "desc" }],
  });

  // Get counts by status
  const counts = await prisma.booking.groupBy({
    by: ["status"],
    where: { shopId: activeShopId },
    _count: true,
  });

  const statusCounts = counts.reduce((acc, item) => {
    acc[item.status] = item._count;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Kelola Booking</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <a
          href="/dashboard/bookings"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            !selectedStatus
              ? "bg-amber-500 text-slate-900"
              : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Semua ({bookings.length})
        </a>
        <a
          href="/dashboard/bookings?status=PENDING"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedStatus === "PENDING"
              ? "bg-yellow-500 text-slate-900"
              : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Menunggu ({statusCounts.PENDING || 0})
        </a>
        <a
          href="/dashboard/bookings?status=CONFIRMED"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedStatus === "CONFIRMED"
              ? "bg-blue-500 text-slate-900"
              : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Dikonfirmasi ({statusCounts.CONFIRMED || 0})
        </a>
        <a
          href="/dashboard/bookings?status=COMPLETED"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedStatus === "COMPLETED"
              ? "bg-green-500 text-slate-900"
              : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Selesai ({statusCounts.COMPLETED || 0})
        </a>
        <a
          href="/dashboard/bookings?status=CANCELLED"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedStatus === "CANCELLED"
              ? "bg-red-500 text-slate-900"
              : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Dibatalkan ({statusCounts.CANCELLED || 0})
        </a>
      </div>

      {/* Bookings Table */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50">
        <BookingTable bookings={bookings} />
      </div>
    </div>
  );
}