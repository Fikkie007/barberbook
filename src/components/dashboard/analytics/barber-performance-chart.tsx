"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarberPerformance } from "@/types";
import { chartTooltipStyle, chartLabelStyle, ChartEmptyState, formatCurrency, formatCurrencyShort } from "./chart-utils";

interface BarberPerformanceChartProps {
  data: BarberPerformance[];
}

export default function BarberPerformanceChart({ data }: BarberPerformanceChartProps) {
  if (data.length === 0) {
    return <ChartEmptyState message="Belum ada data barber" />;
  }

  const sortedData = [...data].sort((a, b) => b.revenue - a.revenue);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={sortedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="barberName"
          stroke="#94a3b8"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="left"
          stroke="#94a3b8"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#94a3b8"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatCurrencyShort}
        />
        <Tooltip
          contentStyle={chartTooltipStyle}
          labelStyle={chartLabelStyle}
          formatter={(value, name) => {
            const numValue = typeof value === "number" ? value : 0;
            const nameStr = String(name);
            if (nameStr === "revenue") {
              return [formatCurrency(numValue), "Pendapatan"];
            }
            return [numValue, "Booking"];
          }}
        />
        <Legend
          formatter={(value) => {
            if (value === "bookingCount") return "Jumlah Booking";
            return "Pendapatan";
          }}
        />
        <Bar
          yAxisId="left"
          dataKey="bookingCount"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          yAxisId="right"
          dataKey="revenue"
          fill="#f59e0b"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}