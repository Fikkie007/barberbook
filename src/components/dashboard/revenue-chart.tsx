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

interface RevenueChartProps {
  data: Array<{
    month: string;
    online: number;
    offline: number;
  }>;
}

export default function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Belum ada data pendapatan
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return `Rp ${(value / 1000).toFixed(0)}K`;
  };

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorOffline" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="month"
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
          tickFormatter={formatCurrency}
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
            if (nameStr === "online") {
              return [formatCurrency(numValue), "Online"];
            }
            // offline
            return [formatCurrency(numValue), "Offline"];
          }}
        />
        <Legend
          formatter={(value) => {
            if (value === "online") return "Online";
            return "Offline";
          }}
        />
        <Area
          type="monotone"
          dataKey="online"
          stackId="1"
          stroke="#3b82f6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorOnline)"
        />
        <Area
          type="monotone"
          dataKey="offline"
          stackId="1"
          stroke="#22c55e"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorOffline)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}