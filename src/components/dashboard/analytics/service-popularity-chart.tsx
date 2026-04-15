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

interface ServicePopularityChartProps {
  data: ServicePopularity[];
}

export default function ServicePopularityChart({ data }: ServicePopularityChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Belum ada data layanan
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b.bookingCount - a.bookingCount).slice(0, 10);

  const formatCurrency = (value: number) => {
    return `Rp ${(value / 1000).toFixed(0)}K`;
  };

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
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "#fff" }}
          formatter={(value, name) => {
            const numValue = typeof value === "number" ? value : 0;
            const nameStr = String(name);
            if (nameStr === "revenue") {
              return [`Rp ${numValue.toLocaleString("id-ID")}`, "Pendapatan"];
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