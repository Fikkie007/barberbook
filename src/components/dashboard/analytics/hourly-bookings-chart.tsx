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
import { HourlyBookings } from "@/types";
import { chartTooltipStyle, chartLabelStyle, ChartEmptyState } from "./chart-utils";

interface HourlyBookingsChartProps {
  data: HourlyBookings[];
}

export default function HourlyBookingsChart({ data }: HourlyBookingsChartProps) {
  if (data.length === 0) {
    return <ChartEmptyState message="Belum ada data booking" />;
  }

  // Fill in missing hours with 0
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const chartData = hours.map(hour => {
    const found = data.find(d => d.hour === hour);
    return {
      hour,
      label: `${hour.toString().padStart(2, "0")}:00`,
      count: found?.count || 0,
    };
  });

  // Find peak hour
  const peakHour = chartData.reduce((max, current) =>
    current.count > max.count ? current : max
  );

  return (
    <div>
      {peakHour.count > 0 && (
        <div className="mb-4 rounded-lg bg-amber-500/10 p-3">
          <p className="text-sm text-slate-400">
            Jam tersibuk: <span className="font-bold text-amber-400">{peakHour.label}</span> dengan {peakHour.count} booking
          </p>
        </div>
      )}
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="label"
            stroke="#94a3b8"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval={2}
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
            formatter={(value) => [value, "Booking"]}
            labelFormatter={(label) => `Jam ${label}`}
          />
          <Bar
            dataKey="count"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}