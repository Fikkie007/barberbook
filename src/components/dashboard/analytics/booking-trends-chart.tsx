"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BookingTrends } from "@/types";
import { chartTooltipStyle, chartLabelStyle, ChartEmptyState, formatCurrency, formatCurrencyShort } from "./chart-utils";

interface BookingTrendsChartProps {
  data: BookingTrends[];
}

export default function BookingTrendsChart({ data }: BookingTrendsChartProps) {
  if (data.length === 0) {
    return <ChartEmptyState message="Belum ada data booking" />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="date"
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
            if (value === "bookings") return "Jumlah Booking";
            return "Pendapatan";
          }}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="bookings"
          stroke="#3b82f6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorBookings)"
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="revenue"
          stroke="#f59e0b"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorRevenue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}