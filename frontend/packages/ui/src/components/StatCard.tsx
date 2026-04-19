import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number;       // % thay đổi, dương = tăng, âm = giảm
  className?: string;
}

export function StatCard({ title, value, icon, trend, className = "" }: StatCardProps) {
  return (
    <div className={`rounded-xl bg-white p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {icon && <div className="text-green-500">{icon}</div>}
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {trend !== undefined && (
        <p className={`mt-1 text-sm ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% so với tháng trước
        </p>
      )}
    </div>
  );
}