import React from "react";

type AccentColor = "green" | "blue" | "purple" | "orange" | "rose" | "teal";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number;       // % thay đổi, dương = tăng, âm = giảm
  color?: AccentColor;
  className?: string;
}

const COLOR_MAP: Record<AccentColor, { icon: string; trend: string; border: string }> = {
  green:  { icon: "text-emerald-500 bg-emerald-50",  trend: "text-emerald-600",  border: "border-emerald-100" },
  blue:   { icon: "text-blue-500 bg-blue-50",        trend: "text-blue-600",    border: "border-blue-100" },
  purple: { icon: "text-violet-500 bg-violet-50",    trend: "text-violet-600",  border: "border-violet-100" },
  orange: { icon: "text-orange-500 bg-orange-50",    trend: "text-orange-600",  border: "border-orange-100" },
  rose:   { icon: "text-rose-500 bg-rose-50",        trend: "text-rose-600",    border: "border-rose-100" },
  teal:   { icon: "text-teal-500 bg-teal-50",        trend: "text-teal-600",    border: "border-teal-100" },
};

export function StatCard({ title, value, icon, trend, color = "green", className = "" }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={`rounded-xl bg-white p-5 shadow-sm border ${c.border} transition hover:shadow-md ${className}`}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-base ${c.icon}`}>
            {icon}
          </div>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
      {trend !== undefined && (
        <p className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
          <span>{trend >= 0 ? "▲" : "▼"}</span>
          <span>{Math.abs(trend)}% so với tháng trước</span>
        </p>
      )}
    </div>
  );
}