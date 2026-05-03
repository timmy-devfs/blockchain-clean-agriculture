"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@bicap/ui";
import type { ShipmentStatusHistory } from "@bicap/types";
import { getAdminShipments, type AdminShipmentView } from "@/lib/api";

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

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("vi-VN");
}

export default function ShipmentsPage() {
  const [activeStatus, setActiveStatus] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AdminShipmentView | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-shipments", activeStatus, page],
    queryFn: () => getAdminShipments({ status: activeStatus || undefined, page, size: PAGE_SIZE }),
    refetchInterval: 15_000,
  });

  const rows = data?.data ?? [];
  const showEmptyState = !isLoading && (rows.length === 0 || isError);

  const selectedTimeline = useMemo(() => {
    const rows = (selected?.statusHistory ?? []) as ShipmentStatusHistory[];
    return [...rows].sort((a, b) => {
      const ta = new Date(a.createdAt ?? "").getTime();
      const tb = new Date(b.createdAt ?? "").getTime();
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
    });
  }, [selected]);

  const receivedAt = useMemo(() => {
    const found = selectedTimeline.find((x) => {
      const note = `${x.note ?? ""} ${x.location ?? ""}`.toLowerCase();
      return x.status === "PICKED_UP" || note.includes("nhận hàng") || note.includes("đã lấy");
    });
    return found?.createdAt;
  }, [selectedTimeline]);

  const deliveredAt = useMemo(() => {
    const found = selectedTimeline.find((x) => x.status === "DELIVERED");
    return found?.createdAt;
  }, [selectedTimeline]);

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

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Mã chuyến</th>
                <th className="px-4 py-3 text-left">Mã đơn</th>
                <th className="px-4 py-3 text-left">Tài xế</th>
                <th className="px-4 py-3 text-left">Xe</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-left">Ngày giao dự kiến</th>
                <th className="px-4 py-3 text-left">Thời gian tạo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-t border-gray-100 hover:bg-teal-50/40"
                  onClick={() => setSelected(row)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.id || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{row.orderId || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{row.driverName || row.driverId || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.vehicleId || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status as string} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.estimatedDelivery
                      ? `${row.estimatedDelivery}${row.estimatedTime ? ` ${row.estimatedTime}` : ""}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.rawCreatedAt || formatDateTime(row.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showEmptyState && (
          <div className="border-t border-gray-100 px-6 py-12 text-center">
            <p className="text-2xl mb-2">📦</p>
            <p className="font-medium text-gray-700">Chưa có dữ liệu vận chuyển</p>
            <p className="mt-1 text-sm text-gray-500">
              Đồng bộ từ Shipping dashboard (POST /api/sync-orders) hoặc dữ liệu từ shipping-service sẽ hiển thị tại đây.
            </p>
          </div>
        )}
      </div>

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

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Chi tiết lô hàng</h2>
                <p className="text-sm text-gray-500">Xem đầy đủ thông tin đơn vận chuyển và timeline</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"><span className="text-gray-500">Mã chuyến:</span> <span className="font-mono">{selected.id || "—"}</span></div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"><span className="text-gray-500">Mã đơn:</span> <span className="font-mono">{selected.orderId || "—"}</span></div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"><span className="text-gray-500">Hàng hóa:</span> <span className="font-medium text-gray-900">{selected.cargo || "—"}</span></div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"><span className="text-gray-500">Trọng lượng:</span> <span className="font-medium text-gray-900">{selected.weight ? `${selected.weight} kg` : "—"}</span></div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"><span className="text-gray-500">Số kiện:</span> <span className="font-medium text-gray-900">{selected.qty || "—"}</span></div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"><span className="text-gray-500">Nông trại:</span> <span className="font-medium text-gray-900">{selected.farm || "—"}</span></div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"><span className="text-gray-500">Điểm xuất phát:</span> <span className="font-medium text-gray-900">{selected.from || "—"}</span></div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"><span className="text-gray-500">Điểm đến:</span> <span className="font-medium text-gray-900">{selected.to || "—"}</span></div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"><span className="text-gray-500">Tài xế:</span> <span className="font-medium text-gray-900">{selected.driverName || selected.driverId || "—"}</span></div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"><span className="text-gray-500">SĐT tài xế:</span> <span className="font-medium text-gray-900">{selected.driverPhone || "—"}</span></div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"><span className="text-gray-500">Biển số xe:</span> <span className="font-medium text-gray-900">{selected.driverPlate || "—"}</span></div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"><span className="text-gray-500">Loại xe:</span> <span className="font-medium text-gray-900">{selected.driverVehicle || "—"}</span></div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"><span className="text-gray-500">Trạng thái:</span> <StatusBadge status={selected.status as string} /></div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"><span className="text-gray-500">Thời gian tạo lô:</span> <span className="font-medium text-gray-900">{selected.rawCreatedAt || formatDateTime(selected.createdAt)}</span></div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"><span className="text-gray-500">Ngày giao dự kiến:</span> <span className="font-medium text-gray-900">{selected.estimatedDelivery ? `${selected.estimatedDelivery}${selected.estimatedTime ? ` ${selected.estimatedTime}` : ""}` : "—"}</span></div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"><span className="text-gray-500">Lúc nhận hàng:</span> <span className="font-medium text-gray-900">{formatDateTime(receivedAt)}</span></div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"><span className="text-gray-500">Lúc giao hàng:</span> <span className="font-medium text-gray-900">{formatDateTime(deliveredAt)}</span></div>
            </div>

            <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
              <div className="mb-1 text-gray-500">Ghi chú</div>
              <div className="text-gray-900">{selected.note || "—"}</div>
            </div>

            <div className="mt-6">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Lịch sử vận chuyển</h3>
              {selectedTimeline.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                  Chưa có timeline chi tiết.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedTimeline.map((item) => (
                    <div key={item.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <div className="text-xs text-gray-500">{formatDateTime(item.createdAt)}</div>
                      <div className="mt-1 text-sm font-semibold text-gray-900">{item.note || item.status}</div>
                      <div className="text-sm text-gray-600">{item.location || "—"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
