import React from "react";
import { SeasonStatus, OrderStatus, ShipmentStatus, UserRole } from "@bicap/types";

type BadgeStatus = SeasonStatus | OrderStatus | ShipmentStatus | UserRole | string;

// Map từng status sang màu Tailwind
const STATUS_COLORS: Record<string, string> = {
  // Farm approval status
  PENDING:  "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",

  // SeasonStatus
  [SeasonStatus.PREPARING]: "bg-yellow-100 text-yellow-800",
  [SeasonStatus.ACTIVE]:    "bg-green-100 text-green-800",
  [SeasonStatus.HARVESTED]: "bg-blue-100 text-blue-800",
  [SeasonStatus.EXPORTED]:  "bg-purple-100 text-purple-800",

  // OrderStatus
  [OrderStatus.PENDING_PAYMENT]: "bg-orange-100 text-orange-800",
  [OrderStatus.PLACED]:          "bg-yellow-100 text-yellow-800",
  [OrderStatus.CONFIRMED]:       "bg-blue-100 text-blue-800",
  [OrderStatus.SHIPPING]:        "bg-indigo-100 text-indigo-800",
  [OrderStatus.DELIVERED]:       "bg-green-100 text-green-800",
  [OrderStatus.CANCELLED]:       "bg-red-100 text-red-800",

  // ShipmentStatus
  [ShipmentStatus.CREATED]:    "bg-slate-100 text-slate-700",
  [ShipmentStatus.ASSIGNED]:   "bg-gray-100 text-gray-700",
  [ShipmentStatus.PICKED_UP]:  "bg-yellow-100 text-yellow-800",
  [ShipmentStatus.IN_TRANSIT]: "bg-blue-100 text-blue-800",
  [ShipmentStatus.DELAYED]:    "bg-orange-100 text-orange-800",
  // DELIVERED / CANCELLED trùng chuỗi với OrderStatus — dùng mục Order phía trên
  [ShipmentStatus.RETURNED]:   "bg-pink-100 text-pink-800",

  // UserRole
  [UserRole.ADMIN]:            "bg-violet-100 text-violet-800",
  [UserRole.FARM_MANAGER]:     "bg-green-100 text-green-800",
  [UserRole.RETAILER]:         "bg-blue-100 text-blue-800",
  [UserRole.SHIP_DRIVER]:      "bg-cyan-100 text-cyan-800",
  [UserRole.SHIPPING_MANAGER]: "bg-teal-100 text-teal-800",
  [UserRole.GUEST]:            "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:  "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  [UserRole.ADMIN]:            "Admin",
  [UserRole.FARM_MANAGER]:     "Farm",
  [UserRole.RETAILER]:         "Nhà bán lẻ",
  [UserRole.SHIP_DRIVER]:      "Tài xế",
  [UserRole.SHIPPING_MANAGER]: "Q.Lý vận chuyển",
  [UserRole.GUEST]:            "Khách",
  [OrderStatus.PENDING_PAYMENT]: "Chờ thanh toán",
  [OrderStatus.PLACED]:          "Đã đặt",
  [OrderStatus.CONFIRMED]:       "Đã xác nhận",
  [OrderStatus.SHIPPING]:        "Đang giao",
  [OrderStatus.DELIVERED]:       "Đã giao",
  [OrderStatus.CANCELLED]:       "Đã hủy",
  [ShipmentStatus.CREATED]:      "Mới tạo",
  [ShipmentStatus.ASSIGNED]:     "Đã giao việc",
  [ShipmentStatus.PICKED_UP]:    "Đã lấy hàng",
  [ShipmentStatus.IN_TRANSIT]:   "Đang vận chuyển",
  [ShipmentStatus.DELAYED]:      "Chậm trễ",
  [ShipmentStatus.RETURNED]:     "Hoàn hàng",
};

interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700";
  const label = STATUS_LABELS[status] ?? status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass} ${className}`}
    >
      {label}
    </span>
  );
}