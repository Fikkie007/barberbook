import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from "date-fns";
import { id } from "date-fns/locale";
import StatsCard from "@/components/dashboard/stats-card";
import BookingTable from "@/components/dashboard/booking-table";
import RevenueChart from "@/components/dashboard/revenue-chart";
import CopyButton from "@/components/dashboard/copy-button";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const selectedShopId = params.shop;

  // Get user's shops
  const shops = await prisma.shop.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true, slug: true },
  });

  // If no shops, show setup prompt
  if (shops.length === 0) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
          <svg
            className="h-10 w-10 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Selamat Datang di BarberBook!</h2>
        <p className="mt-2 text-slate-400">
          Anda belum memiliki toko. Buat toko pertama Anda untuk memulai.
        </p>
        <a
          href="/dashboard/settings?new=true"
          className="mt-6 rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-400"
        >
          Buat Toko Sekarang
        </a>
      </div>
    );
  }

  // Use first shop if none selected
  const activeShopId = selectedShopId || shops[0].id;
  const activeShop = shops.find((s) => s.id === activeShopId) || shops[0];

  const now = new Date();
  const today = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Get stats
  const [
    totalBookings,
    pendingBookings,
    completedBookings,
    cancelledBookings,
    todayBookings,
    thisWeekBookings,
    thisMonthBookings,
    totalRevenue,
    recentBookings,
    monthlyRevenue,
  ] = await Promise.all([
    // Total bookings
    prisma.booking.count({
      where: { shopId: activeShopId },
    }),
    // Pending bookings
    prisma.booking.count({
      where: { shopId: activeShopId, status: "PENDING" },
    }),
    // Completed bookings
    prisma.booking.count({
      where: { shopId: activeShopId, status: "COMPLETED" },
    }),
    // Cancelled bookings
    prisma.booking.count({
      where: { shopId: activeShopId, status: "CANCELLED" },
    }),
    // Today's bookings
    prisma.booking.count({
      where: {
        shopId: activeShopId,
        bookingDate: { gte: today, lte: todayEnd },
      },
    }),
    // This week's bookings
    prisma.booking.count({
      where: {
        shopId: activeShopId,
        bookingDate: { gte: weekStart, lte: weekEnd },
      },
    }),
    // This month's bookings
    prisma.booking.count({
      where: {
        shopId: activeShopId,
        bookingDate: { gte: monthStart, lte: monthEnd },
      },
    }),
    // Total revenue (completed bookings)
    prisma.booking.aggregate({
      where: { shopId: activeShopId, status: "COMPLETED" },
      _sum: { totalPrice: true },
    }),
    // Recent bookings
    prisma.booking.findMany({
      where: { shopId: activeShopId },
      include: { service: true, barber: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // Monthly revenue for chart
    prisma.$queryRaw<Array<{ month: Date; revenue: bigint; count: bigint }>>`
      SELECT
        DATE_TRUNC('month', "bookingDate") as month,
        SUM("totalPrice") as revenue,
        COUNT(*) as count
      FROM bookings
      WHERE "shopId" = ${activeShopId}
        AND status = 'COMPLETED'
        AND "bookingDate" >= DATE_TRUNC('year', CURRENT_DATE)
      GROUP BY DATE_TRUNC('month', "bookingDate")
      ORDER BY month ASC
    `,
  ]);

  const stats = {
    totalBookings,
    pendingBookings,
    completedBookings,
    cancelledBookings,
    todayBookings,
    thisWeekBookings,
    thisMonthBookings,
    totalRevenue: totalRevenue._sum.totalPrice || 0,
  };

  // Format chart data
  const chartData = monthlyRevenue.map((item) => ({
    month: format(item.month, "MMM", { locale: id }),
    revenue: Number(item.revenue),
    bookings: Number(item.count),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">
            {format(now, "EEEE, d MMMM yyyy", { locale: id })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Toko:</span>
          <span className="font-semibold text-white">{activeShop.name}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Booking"
          value={stats.totalBookings}
          icon="calendar"
          color="blue"
        />
        <StatsCard
          title="Menunggu Konfirmasi"
          value={stats.pendingBookings}
          icon="clock"
          color="yellow"
        />
        <StatsCard
          title="Selesai"
          value={stats.completedBookings}
          icon="check"
          color="green"
        />
        <StatsCard
          title="Total Pendapatan"
          value={`Rp ${stats.totalRevenue.toLocaleString("id-ID")}`}
          icon="money"
          color="amber"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">Booking Hari Ini</p>
          <p className="text-2xl font-bold text-white">{stats.todayBookings}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">Booking Minggu Ini</p>
          <p className="text-2xl font-bold text-white">{stats.thisWeekBookings}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">Booking Bulan Ini</p>
          <p className="text-2xl font-bold text-white">{stats.thisMonthBookings}</p>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Pendapatan Bulanan
          </h2>
          <RevenueChart data={chartData} />
        </div>

        {/* Booking Link */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <h2 className="mb-4 text-lg font-semibold text-white">Link Booking</h2>
          <p className="mb-4 text-sm text-slate-400">
            Bagikan link ini ke pelanggan Anda untuk menerima booking online:
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-slate-700/50 p-3">
            <span className="flex-1 truncate text-sm text-slate-300">
              {process.env.NEXT_PUBLIC_APP_URL?.replace("://", `://${activeShop.slug}.`) || `https://${activeShop.slug}.barberbook.com`}
            </span>
            <CopyButton text={process.env.NEXT_PUBLIC_APP_URL?.replace("://", `://${activeShop.slug}.`) || `https://${activeShop.slug}.barberbook.com`} />
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50">
        <div className="border-b border-slate-700 p-4">
          <h2 className="text-lg font-semibold text-white">Booking Terbaru</h2>
        </div>
        <BookingTable bookings={recentBookings} />
      </div>
    </div>
  );
}