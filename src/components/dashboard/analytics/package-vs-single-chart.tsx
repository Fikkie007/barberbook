"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PackageVsSingle } from "@/types";

interface PackageVsSingleChartProps {
  data: PackageVsSingle;
}

export default function PackageVsSingleChart({ data }: PackageVsSingleChartProps) {
  if (data.packageCount === 0 && data.singleCount === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Belum ada data booking
      </div>
    );
  }

  const bookingData = [
    { name: "Paket", value: data.packageCount, color: "#8b5cf6" },
    { name: "Layanan Single", value: data.singleCount, color: "#3b82f6" },
  ];

  const revenueData = [
    { name: "Paket", value: data.packageRevenue, color: "#8b5cf6" },
    { name: "Layanan Single", value: data.singleRevenue, color: "#3b82f6" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <p className="mb-2 text-center text-sm text-slate-400">Jumlah Booking</p>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={bookingData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {bookingData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
              formatter={(value) => [value, "Booking"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="mb-2 text-center text-sm text-slate-400">Pendapatan</p>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={revenueData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              label={({ name, value }) => `${name}: Rp ${(Number(value) / 1000).toFixed(0)}K`}
            >
              {revenueData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
              formatter={(value) => [`Rp ${Number(value).toLocaleString("id-ID")}`, "Pendapatan"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}