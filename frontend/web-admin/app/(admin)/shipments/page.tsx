"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable, StatusBadge } from "@bicap/ui";
import type { Column } from "@bicap/ui";
import type { Shipment } from "@bicap/types";
import { getAdminShipments } from "@/lib/api";

const STATUS_TABS = [
  { label: "Tất cả",          value: "" },
  { label: "Đã giao việc",    value: "ASSIGNED" },
  { label: "Đã lấy hàng",    value: "PICKED_UP" },
  { label: "Đang vận chuyển", value: "IN_TRANSIT" },
  { label: "Chậm trễ",        value: "DELAYED" },
  { label: "Đã giao",         value: "DELIVERED" },
  { label: "Hoàn hàng",       value: "RETURNED" },
];

const PAGE_SIZE = 20;

const COLS: Column<Shipment>[] = [
  { key: "id",                header: "Mã chuyến",
    render: (v) => <span className="font-mono text-xs text-gray-500 select-all">{String(v).slice(0, 8)}…</span> },
  { key: "orderId",           header: "Mã đơn",
    render: (v) => <span className="font-mono text-xs text-gray-600">{String(v).slice(0, 8)}…</span> },
  { key: "driverId",          header: "Tài xế",
    render: (v) => <span className="text-xs text-gray-600">{String(v).slice(0, 8)}…</span> },
  { key: "status",            header: "Trạng thái",
    render: (v) => <StatusBadge status={v as string} /> },
  { key: "estimatedDelivery", header: "Dự kiến giao",
    render: (v) => (
      <span className="text-xs text-gray-500">
        {v ? new Date(v as string).toLocaleDateString("vi-VN") : "—"}
      </span>
    ),
  },
  { key: "createdAt",         header: "Ngày tạo",
    render: (v) => <span className="text-xs text-gray-500">{new Date(v as string).toLocaleDateString("vi-VN")}</span> },
];

export default function ShipmentsPage() {
  const [activeStatus, setActiveStatus] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-shipments", activeStatus, page],
    queryFn: () => getAdminShipments({ status: activeStatus || undefined, page, size: PAGE_SIZE }),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vận chuyển</h1>
        <p className="text-sm text-gray-500">Quản lý tất cả chuyến vận chuyển trong hệ thống</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveStatus(tab.value); setPage(0); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeStatus === tab.value
                ? "bg-teal-600 text-white shadow-sm"
                : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable<Shipment>
        columns={COLS}
        data={data?.data ?? []}
        isLoading={isLoading}
        keyField="id"
        emptyMessage="Không có chuyến vận chuyển nào"
      />

      {/* Pagination */}
      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
          <span>
            Tổng <strong className="text-gray-800">{data?.total ?? 0}</strong> chuyến
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

      {/* Empty state khi chưa có dữ liệu hoặc API lỗi */}
      {!isLoading && !data && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <p className="text-3xl mb-3">🚚</p>
          <p className="font-medium text-gray-700">Không tải được dữ liệu vận chuyển</p>
          <p className="mt-1 text-sm text-gray-400">
            Vui lòng kiểm tra Gateway route và endpoint <code className="font-mono text-xs bg-gray-100 px-1 rounded">/api/shipping/shipments</code>
          </p>
        </div>
      )}
    </div>
  );
}
