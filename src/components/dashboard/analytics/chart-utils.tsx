"use client";

// Shared tooltip style for all Recharts charts
export const chartTooltipStyle = {
  backgroundColor: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "8px",
};

// Shared tooltip label style
export const chartLabelStyle = { color: "#fff" };

// Empty state component for charts with no data
interface ChartEmptyStateProps {
  message: string;
  height?: number;
}

export function ChartEmptyState({ message, height = 64 }: ChartEmptyStateProps) {
  return (
    <div
      className="flex items-center justify-center text-slate-400"
      style={{ height: `${height * 4}px` }}
    >
      {message}
    </div>
  );
}

// Currency formatter helper
export function formatCurrency(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

// Short currency formatter (e.g., "Rp 50K")
export function formatCurrencyShort(value: number): string {
  return `Rp ${(value / 1000).toFixed(0)}K`;
}