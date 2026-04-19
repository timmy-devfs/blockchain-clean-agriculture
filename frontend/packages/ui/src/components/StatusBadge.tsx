import React from "react";
import { SeasonStatus, OrderStatus, ShipmentStatus } from "@bicap/types";

type BadgeStatus = SeasonStatus | OrderStatus | ShipmentStatus | string;

// Map từng status sang màu Tailwind
const STATUS_COLORS: Record<string, string> = {
  // SeasonStatus
  [SeasonStatus.PREPARING]: "bg-yellow-100 text-yellow-800",
  [SeasonStatus.ACTIVE]: "bg-green-100 text-green-800",
  [SeasonStatus.HARVESTED]: "bg-blue-100 text-blue-800",
  [SeasonStatus.EXPORTED]: "bg-purple-100 text-purple-800",
  // OrderStatus
  [OrderStatus.PENDING_PAYMENT]: "bg-orange-100 text-orange-800",
  [OrderStatus.PLACED]: "bg-yellow-100 text-yellow-800",
  [OrderStatus.CONFIRMED]: "bg-blue-100 text-blue-800",
  [OrderStatus.SHIPPING]: "bg-indigo-100 text-indigo-800",
  [OrderStatus.DELIVERED]: "bg-green-100 text-green-800",
  [OrderStatus.CANCELLED]: "bg-red-100 text-red-800",
  // ShipmentStatus
  [ShipmentStatus.ASSIGNED]: "bg-gray-100 text-gray-800",
  [ShipmentStatus.PICKED_UP]: "bg-yellow-100 text-yellow-800",
  [ShipmentStatus.IN_TRANSIT]: "bg-blue-100 text-blue-800",
  [ShipmentStatus.DELAYED]: "bg-orange-100 text-orange-800",

  [ShipmentStatus.RETURNED]: "bg-pink-100 text-pink-800",
};

interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-800";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass} ${className}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}