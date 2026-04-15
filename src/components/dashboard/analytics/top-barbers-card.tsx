"use client";

import { BarberPerformance } from "@/types";

interface TopBarbersCardProps {
  data: BarberPerformance[];
}

export default function TopBarbersCard({ data }: TopBarbersCardProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <h3 className="mb-4 text-lg font-semibold text-white">Top Barber</h3>
        <p className="text-slate-400">Belum ada data barber</p>
      </div>
    );
  }

  const topByRevenue = [...data]
    .filter(b => b.barberId !== null)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);

  const topByBookings = [...data]
    .filter(b => b.barberId !== null)
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 3);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <h3 className="mb-4 text-lg font-semibold text-white">Top Barber</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-sm text-slate-400">Pendapatan Tertinggi</p>
          <div className="space-y-2">
            {topByRevenue.map((barber, index) => (
              <div
                key={barber.barberId || `revenue-${index}`}
                className="flex items-center justify-between rounded-lg bg-slate-700/50 p-2"
              >
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    index === 0 ? "bg-amber-500 text-slate-900" :
                    index === 1 ? "bg-slate-400 text-slate-900" :
                    "bg-slate-600 text-white"
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-sm text-white">{barber.barberName}</span>
                </div>
                <span className="text-sm font-medium text-amber-400">
                  Rp {barber.revenue.toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-slate-400">Booking Terbanyak</p>
          <div className="space-y-2">
            {topByBookings.map((barber, index) => (
              <div
                key={barber.barberId || `bookings-${index}`}
                className="flex items-center justify-between rounded-lg bg-slate-700/50 p-2"
              >
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    index === 0 ? "bg-blue-500 text-white" :
                    index === 1 ? "bg-slate-400 text-slate-900" :
                    "bg-slate-600 text-white"
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-sm text-white">{barber.barberName}</span>
                </div>
                <span className="text-sm font-medium text-blue-400">
                  {barber.bookingCount} booking
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}