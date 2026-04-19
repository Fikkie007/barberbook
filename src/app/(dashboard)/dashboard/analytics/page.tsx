import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format, startOfYear, endOfYear } from "date-fns";
import { id } from "date-fns/locale";
import BarberPerformanceChart from "@/components/dashboard/analytics/barber-performance-chart";
import TopBarbersCard from "@/components/dashboard/analytics/top-barbers-card";
import ServicePopularityChart from "@/components/dashboard/analytics/service-popularity-chart";
import ServiceRevenueChart from "@/components/dashboard/analytics/service-revenue-chart";
import PackageVsSingleChart from "@/components/dashboard/analytics/package-vs-single-chart";
import HourlyBookingsChart from "@/components/dashboard/analytics/hourly-bookings-chart";
import WeeklyPatternChart from "@/components/dashboard/analytics/weekly-pattern-chart";
import BookingTrendsChart from "@/components/dashboard/analytics/booking-trends-chart";
import CustomerSegmentsChart from "@/components/dashboard/analytics/customer-segments-chart";
import CustomerFrequencyChart from "@/components/dashboard/analytics/customer-frequency-chart";
import TopCustomersTable from "@/components/dashboard/analytics/top-customers-table";
import {
  BarberPerformance,
  ServicePopularity,
  HourlyBookings,
  DailyBookings,
  CustomerFrequency,
  CustomerSegments,
  BookingTrends,
  PackageVsSingle,
} from "@/types";
import { getUserShops, getActiveShopId } from "@/lib/shop-helpers";

export default async function AnalyticsPage({
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
            Silakan pilih toko dari sidebar untuk melihat analytics.
          </p>
        </div>
      );
    }
    redirect("/dashboard");
  }

  const activeShop = shops.find((s) => s.id === activeShopId) || shops[0];

  const now = new Date();
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);

  // Get barbers for this shop
  const barbers = await prisma.barber.findMany({
    where: { shopId: activeShopId },
    select: { id: true, name: true },
  });

  // Get services for this shop
  const services = await prisma.service.findMany({
    where: { shopId: activeShopId },
    select: { id: true, name: true },
  });

  // Get packages for this shop
  const packages = await prisma.servicePackage.findMany({
    where: { shopId: activeShopId },
    select: { id: true, name: true },
  });

  // Barber Performance - bookings and revenue per barber
  const barberStats = await prisma.booking.groupBy({
    by: ["barberId"],
    where: {
      shopId: activeShopId,
      status: "COMPLETED",
      bookingDate: { gte: yearStart, lte: yearEnd },
    },
    _count: { id: true },
    _sum: { totalPrice: true },
  });

  const barberPerformance: BarberPerformance[] = barberStats.map((stat) => {
    const barber = barbers.find((b) => b.id === stat.barberId);
    return {
      barberId: stat.barberId,
      barberName: barber?.name || "Tanpa Barber",
      bookingCount: stat._count.id,
      revenue: stat._sum.totalPrice || 0,
    };
  });

  // Add barbers with no bookings
  barbers.forEach((barber) => {
    if (!barberPerformance.find((b) => b.barberId === barber.id)) {
      barberPerformance.push({
        barberId: barber.id,
        barberName: barber.name,
        bookingCount: 0,
        revenue: 0,
      });
    }
  });

  // Bookings without barber assigned
  const bookingsWithoutBarber = await prisma.booking.count({
    where: {
      shopId: activeShopId,
      status: "COMPLETED",
      barberId: null,
      bookingDate: { gte: yearStart, lte: yearEnd },
    },
  });

  const revenueWithoutBarber = await prisma.booking.aggregate({
    where: {
      shopId: activeShopId,
      status: "COMPLETED",
      barberId: null,
      bookingDate: { gte: yearStart, lte: yearEnd },
    },
    _sum: { totalPrice: true },
  });

  if (
    bookingsWithoutBarber > 0 &&
    !barberPerformance.find((b) => b.barberId === null)
  ) {
    barberPerformance.push({
      barberId: null,
      barberName: "Tanpa Barber",
      bookingCount: bookingsWithoutBarber,
      revenue: revenueWithoutBarber._sum.totalPrice || 0,
    });
  }

  // Service Popularity - single services
  const serviceStats = await prisma.booking.groupBy({
    by: ["serviceId"],
    where: {
      shopId: activeShopId,
      status: "COMPLETED",
      serviceId: { not: null },
      bookingDate: { gte: yearStart, lte: yearEnd },
    },
    _count: { id: true },
    _sum: { totalPrice: true },
  });

  const servicePopularity: ServicePopularity[] = serviceStats.map((stat) => {
    const service = services.find((s) => s.id === stat.serviceId);
    return {
      id: stat.serviceId!,
      name: service?.name || "Unknown",
      type: "service",
      bookingCount: stat._count.id,
      revenue: stat._sum.totalPrice || 0,
    };
  });

  // Package Popularity
  const packageStats = await prisma.booking.groupBy({
    by: ["packageId"],
    where: {
      shopId: activeShopId,
      status: "COMPLETED",
      packageId: { not: null },
      bookingDate: { gte: yearStart, lte: yearEnd },
    },
    _count: { id: true },
    _sum: { totalPrice: true },
  });

  packageStats.forEach((stat) => {
    const pkg = packages.find((p) => p.id === stat.packageId);
    servicePopularity.push({
      id: stat.packageId!,
      name: pkg?.name || "Unknown",
      type: "package",
      bookingCount: stat._count.id,
      revenue: stat._sum.totalPrice || 0,
    });
  });

  // Package vs Single
  const packageVsSingle: PackageVsSingle = {
    packageCount: packageStats.reduce((sum, s) => sum + s._count.id, 0),
    singleCount: serviceStats.reduce((sum, s) => sum + s._count.id, 0),
    packageRevenue: packageStats.reduce(
      (sum, s) => sum + (s._sum.totalPrice || 0),
      0,
    ),
    singleRevenue: serviceStats.reduce(
      (sum, s) => sum + (s._sum.totalPrice || 0),
      0,
    ),
  };

  // Hourly Bookings
  const hourlyData = await prisma.$queryRaw<
    Array<{ hour: number; count: bigint }>
  >`
    SELECT
      EXTRACT(HOUR FROM CAST("bookingTime" AS TIME))::int as hour,
      COUNT(*) as count
    FROM bookings
    WHERE "shopId" = ${activeShopId}
      AND status = 'COMPLETED'
      AND "bookingDate" >= ${yearStart}
      AND "bookingDate" <= ${yearEnd}
    GROUP BY hour
    ORDER BY hour
  `;

  const hourlyBookings: HourlyBookings[] = hourlyData.map((d) => ({
    hour: d.hour,
    count: Number(d.count),
  }));

  // Daily (Weekly) Bookings
  const dailyData = await prisma.$queryRaw<
    Array<{ day_of_week: number; count: bigint }>
  >`
    SELECT
      EXTRACT(DOW FROM "bookingDate")::int as day_of_week,
      COUNT(*) as count
    FROM bookings
    WHERE "shopId" = ${activeShopId}
      AND status = 'COMPLETED'
      AND "bookingDate" >= ${yearStart}
      AND "bookingDate" <= ${yearEnd}
    GROUP BY day_of_week
    ORDER BY day_of_week
  `;

  const dailyBookings: DailyBookings[] = dailyData.map((d) => ({
    dayOfWeek: d.day_of_week,
    count: Number(d.count),
  }));

  // Booking Trends (daily for last 30 days)
  const trendsData = await prisma.$queryRaw<
    Array<{ date: Date; bookings: bigint; revenue: bigint }>
  >`
    SELECT
      "bookingDate" as date,
      COUNT(*) as bookings,
      SUM("totalPrice") as revenue
    FROM bookings
    WHERE "shopId" = ${activeShopId}
      AND status = 'COMPLETED'
      AND "bookingDate" >= ${yearStart}
      AND "bookingDate" <= ${yearEnd}
    GROUP BY "bookingDate"
    ORDER BY "bookingDate" ASC
  `;

  const bookingTrends: BookingTrends[] = trendsData.map((d) => ({
    date: format(d.date, "d MMM", { locale: id }),
    bookings: Number(d.bookings),
    revenue: Number(d.revenue),
  }));

  // Customer Frequency
  const customerData = await prisma.$queryRaw<
    Array<{
      customerPhone: string;
      customerName: string;
      booking_count: bigint;
      total_spent: bigint;
      first_booking: Date;
      last_booking: Date;
    }>
  >`
    SELECT
      "customerPhone",
      "customerName",
      COUNT(*) as booking_count,
      SUM("totalPrice") as total_spent,
      MIN("bookingDate") as first_booking,
      MAX("bookingDate") as last_booking
    FROM bookings
    WHERE "shopId" = ${activeShopId}
      AND status = 'COMPLETED'
      AND "bookingDate" >= ${yearStart}
      AND "bookingDate" <= ${yearEnd}
    GROUP BY "customerPhone", "customerName"
    ORDER BY total_spent DESC
  `;

  const customerFrequency: CustomerFrequency[] = customerData.map((c) => ({
    customerPhone: c.customerPhone,
    customerName: c.customerName,
    bookingCount: Number(c.booking_count),
    totalSpent: Number(c.total_spent),
    firstBooking: c.first_booking.toISOString(),
    lastBooking: c.last_booking.toISOString(),
    isNew: Number(c.booking_count) === 1,
  }));

  // Customer Segments
  const newCustomers = customerFrequency.filter((c) => c.isNew);
  const returningCustomers = customerFrequency.filter((c) => !c.isNew);

  const customerSegments: CustomerSegments = {
    newCustomers: newCustomers.length,
    returningCustomers: returningCustomers.length,
    newRevenue: newCustomers.reduce((sum, c) => sum + c.totalSpent, 0),
    returningRevenue: returningCustomers.reduce(
      (sum, c) => sum + c.totalSpent,
      0,
    ),
  };

  // Frequency distribution
  const frequencyDistribution = customerFrequency.reduce<Map<number, number>>(
    (map, c) => {
      const freq = c.bookingCount;
      map.set(freq, (map.get(freq) || 0) + 1);
      return map;
    },
    new Map(),
  );

  const frequencyChartData = Array.from(frequencyDistribution.entries())
    .map(([frequency, count]) => ({ frequency, count }))
    .sort((a, b) => a.frequency - b.frequency);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400">
            {format(now, "EEEE, d MMMM yyyy", { locale: id })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Toko:</span>
          <span className="font-semibold text-white">{activeShop.name}</span>
        </div>
      </div>

      {/* Barber Performance Section */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Performa Barber
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <BarberPerformanceChart data={barberPerformance} />
          <TopBarbersCard
            data={barberPerformance.filter((b) => b.barberId !== null)}
          />
        </div>
      </div>

      {/* Service Analytics Section */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Analisis Layanan
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h3 className="mb-2 text-sm text-slate-400">Layanan Populer</h3>
            <ServicePopularityChart data={servicePopularity} />
          </div>
          <div>
            <h3 className="mb-2 text-sm text-slate-400">
              Distribusi Pendapatan
            </h3>
            <ServiceRevenueChart data={servicePopularity} />
          </div>
        </div>
        <div className="mt-6">
          <h3 className="mb-2 text-sm text-slate-400">
            Paket vs Layanan Single
          </h3>
          <PackageVsSingleChart data={packageVsSingle} />
        </div>
      </div>

      {/* Time Analytics Section */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Pola Waktu Booking
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm text-slate-400">Jam Tersibuk</h3>
            <HourlyBookingsChart data={hourlyBookings} />
          </div>
          <div>
            <h3 className="mb-2 text-sm text-slate-400">Hari Tersibuk</h3>
            <WeeklyPatternChart data={dailyBookings} />
          </div>
        </div>
        <div className="mt-6">
          <h3 className="mb-2 text-sm text-slate-400">Tren Booking</h3>
          <BookingTrendsChart data={bookingTrends} />
        </div>
      </div>

      {/* Customer Insights Section */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Insight Pelanggan
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm text-slate-400">
              Pelanggan Baru vs Repeat
            </h3>
            <CustomerSegmentsChart data={customerSegments} />
          </div>
          <div>
            <h3 className="mb-2 text-sm text-slate-400">
              Frekuensi Booking Pelanggan
            </h3>
            <CustomerFrequencyChart data={frequencyChartData} />
          </div>
        </div>
        <div className="mt-6">
          <h3 className="mb-2 text-sm text-slate-400">Top Pelanggan</h3>
          <TopCustomersTable data={customerFrequency} />
        </div>
      </div>
    </div>
  );
}
