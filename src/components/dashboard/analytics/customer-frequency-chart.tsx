"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CustomerFrequencyChartProps {
  data: Array<{ frequency: number; count: number }>;
}

export default function CustomerFrequencyChart({ data }: CustomerFrequencyChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Belum ada data pelanggan
      </div>
    );
  }

  const chartData = data.map(item => ({
    frequency: `${item.frequency}x`,
    count: item.count,
    label: item.frequency === 1 ? "Baru" :
           item.frequency === 2 ? "Repeat" :
           item.frequency === 3 ? "Regular" :
           "Loyal",
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="frequency"
          stroke="#94a3b8"
          fontSize={12}
          tickLine={false}
          axisLine={false}
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
          formatter={(value) => [value, "Pelanggan"]}
          labelFormatter={(label) => `Booking ${label}`}
        />
        <Bar
          dataKey="count"
          fill="#8b5cf6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}