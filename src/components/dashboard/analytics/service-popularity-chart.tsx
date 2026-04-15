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
import { ServicePopularity } from "@/types";
import { chartTooltipStyle, chartLabelStyle, ChartEmptyState, formatCurrency } from "./chart-utils";

interface ServicePopularityChartProps {
  data: ServicePopularity[];
}

export default function ServicePopularityChart({ data }: ServicePopularityChartProps) {
  if (data.length === 0) {
    return <ChartEmptyState message="Belum ada data layanan" />;
  }

  const sortedData = [...data].sort((a, b) => b.bookingCount - a.bookingCount).slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={sortedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="name"
          stroke="#94a3b8"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          stroke="#94a3b8"
          fontSize={12}
          tickLine={false}
          axisLine={false}
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
          dataKey="bookingCount"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="revenue"
          fill="#f59e0b"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}