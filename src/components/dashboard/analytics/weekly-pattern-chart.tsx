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
import { DailyBookings } from "@/types";
import { chartTooltipStyle, chartLabelStyle, ChartEmptyState } from "./chart-utils";

interface WeeklyPatternChartProps {
  data: DailyBookings[];
}

const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function WeeklyPatternChart({ data }: WeeklyPatternChartProps) {
  if (data.length === 0) {
    return <ChartEmptyState message="Belum ada data booking" />;
  }

  // Fill in all days
  const chartData = dayNames.map((name, index) => {
    const found = data.find(d => d.dayOfWeek === index);
    return {
      day: name,
      count: found?.count || 0,
    };
  });

  // Find busiest day
  const busiestDay = chartData.reduce((max, current) =>
    current.count > max.count ? current : max
  );

  return (
    <div>
      {busiestDay.count > 0 && (
        <div className="mb-4 rounded-lg bg-amber-500/10 p-3">
          <p className="text-sm text-slate-400">
            Hari tersibuk: <span className="font-bold text-amber-400">{busiestDay.day}</span> dengan {busiestDay.count} booking
          </p>
        </div>
      )}
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="day"
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
            contentStyle={chartTooltipStyle}
            labelStyle={chartLabelStyle}
            formatter={(value) => [value, "Booking"]}
          />
          <Bar
            dataKey="count"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}