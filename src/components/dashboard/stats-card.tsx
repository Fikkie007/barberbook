import { Calendar, Clock, CheckCircle, DollarSign } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: "calendar" | "clock" | "check" | "money";
  color: "blue" | "yellow" | "green" | "amber";
}

const iconMap = {
  calendar: Calendar,
  clock: Clock,
  check: CheckCircle,
  money: DollarSign,
};

const colorMap = {
  blue: "bg-blue-500/10 text-blue-400",
  yellow: "bg-yellow-500/10 text-yellow-400",
  green: "bg-green-500/10 text-green-400",
  amber: "bg-amber-500/10 text-amber-400",
};

export default function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const Icon = iconMap[icon];
  const colorClass = colorMap[color];

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}