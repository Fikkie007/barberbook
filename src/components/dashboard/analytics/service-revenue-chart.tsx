"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ServicePopularity } from "@/types";

interface ServiceRevenueChartProps {
  data: ServicePopularity[];
}

const COLORS = [
  "#f59e0b", "#3b82f6", "#22c55e", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"
];

export default function ServiceRevenueChart({ data }: ServiceRevenueChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Belum ada data layanan
      </div>
    );
  }

  const chartData = data
    .filter(item => item.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map(item => ({
      name: item.name.length > 20 ? item.name.substring(0, 20) + "..." : item.name,
      value: item.revenue,
      fullName: item.name,
      type: item.type,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
          labelLine={{ stroke: "#94a3b8" }}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
        <Legend
          formatter={(value) => value}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}