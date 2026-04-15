"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PackageVsSingle } from "@/types";
import { chartTooltipStyle, ChartEmptyState, formatCurrency, formatCurrencyShort } from "./chart-utils";

interface PackageVsSingleChartProps {
  data: PackageVsSingle;
}

export default function PackageVsSingleChart({ data }: PackageVsSingleChartProps) {
  if (data.packageCount === 0 && data.singleCount === 0) {
    return <ChartEmptyState message="Belum ada data booking" />;
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
              contentStyle={chartTooltipStyle}
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
              label={({ name, value }) => `${name}: ${formatCurrencyShort(Number(value))}`}
            >
              {revenueData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(value) => [formatCurrency(Number(value)), "Pendapatan"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}