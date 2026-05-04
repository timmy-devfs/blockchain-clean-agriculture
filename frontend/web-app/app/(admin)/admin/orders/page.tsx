"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable, StatusBadge } from "@bicap/ui";
import type { Column } from "@bicap/ui";
import type { Order } from "@bicap/types";
import { getAdminOrders } from "@/lib/api";

const STATUS_TABS = [
  { label: "Tất cả",           value: "" },
  { label: "Chờ thanh toán",   value: "PENDING_PAYMENT" },
  { label: "Đã đặt",           value: "PLACED" },
  { label: "Đã xác nhận",      value: "CONFIRMED" },
  { label: "Đang giao",        value: "SHIPPING" },
  { label: "Đã giao",          value: "DELIVERED" },
  { label: "Đã hủy",           value: "CANCELLED" },
];

const PAGE_SIZE = 20;

const COLS: Column<Order>[] = [
  {
    key: "id",
    header: "Mã đơn",
    render: (v) => (
      <span className="font-mono text-xs text-gray-500 select-all">{String(v).slice(0, 8)}…</span>
    ),
  },
  {
    key: "retailerId",
    header: "Retailer",
    render: (v) => (
      <span className="font-mono text-xs text-gray-600">{String(v).slice(0, 10)}…</span>
    ),
  },
  {
    key: "productName",
    header: "Sản phẩm",
    render: (_v, row) => (
      <span className="max-w-[180px] truncate text-sm text-gray-800">
        {row.productName ?? "—"}
      </span>
    ),
  },
  {
    key: "quantity",
    header: "Số lượng",
    render: (v) => <span className="font-medium">{v as number}</span>,
  },
  {
    key: "totalPrice",
    header: "Tổng tiền",
    render: (v) => (
      <span className="font-semibold text-gray-800">{Number(v).toLocaleString("vi-VN")} ₫</span>
    ),
  },
  {
    key: "status",
    header: "Trạng thái",
    render: (v) => <StatusBadge status={v as string} />,
  },
  {
    key: "createdAt",
    header: "Ngày tạo",
    render: (v) => (
      <span className="text-xs text-gray-500">
        {new Date(v as string).toLocaleString("vi-VN")}
      </span>
    ),
  },
];

export default function OrdersPage() {
  const [activeStatus, setActiveStatus] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", activeStatus, page],
    queryFn: () => getAdminOrders({ status: activeStatus || undefined, page, size: PAGE_SIZE }),
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Đơn hàng</h1>
        <p className="text-sm text-gray-500">Quản lý tất cả đơn hàng trong hệ thống</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveStatus(tab.value); setPage(0); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeStatus === tab.value
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable<Order>
        columns={COLS}
        data={data?.data ?? []}
        isLoading={isLoading}
        keyField="id"
        emptyMessage="Không có đơn hàng nào"
      />

      {/* Pagination */}
      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
          <span>
            Tổng <strong className="text-gray-800">{data?.total ?? 0}</strong> đơn hàng
            — Trang <strong className="text-gray-800">{(data?.page ?? page) + 1}</strong> / {data?.totalPages ?? 1}
          </span>
          <div className="flex gap-1.5">
            <button
              disabled={page <= 0 || isLoading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition"
            >
              ← Trước
            </button>
            <button
              disabled={isLoading || page >= (data?.totalPages ?? 1) - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition"
            >
              Sau →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
