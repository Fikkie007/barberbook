"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CustomerSegments } from "@/types";
import { chartTooltipStyle, ChartEmptyState, formatCurrency, formatCurrencyShort } from "./chart-utils";

interface CustomerSegmentsChartProps {
  data: CustomerSegments;
}

export default function CustomerSegmentsChart({ data }: CustomerSegmentsChartProps) {
  if (data.newCustomers === 0 && data.returningCustomers === 0) {
    return <ChartEmptyState message="Belum ada data pelanggan" />;
  }

  const customerData = [
    { name: "Pelanggan Baru", value: data.newCustomers, color: "#22c55e" },
    { name: "Pelanggan Repeat", value: data.returningCustomers, color: "#3b82f6" },
  ];

  const revenueData = [
    { name: "Pelanggan Baru", value: data.newRevenue, color: "#22c55e" },
    { name: "Pelanggan Repeat", value: data.returningRevenue, color: "#3b82f6" },
  ];

  const totalCustomers = data.newCustomers + data.returningCustomers;
  const returningRate = totalCustomers > 0
    ? ((data.returningCustomers / totalCustomers) * 100).toFixed(1)
    : 0;

  return (
    <div>
      <div className="mb-4 rounded-lg bg-blue-500/10 p-3">
        <p className="text-sm text-slate-400">
          Tingkat retensi: <span className="font-bold text-blue-400">{returningRate}%</span> pelanggan repeat
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-center text-sm text-slate-400">Jumlah Pelanggan</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={customerData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${value}`}
              >
                {customerData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value) => [value, "Pelanggan"]}
              />
              <Legend />
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
                label={({ value }) => formatCurrencyShort(Number(value))}
              >
                {revenueData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value) => [formatCurrency(Number(value)), "Pendapatan"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}