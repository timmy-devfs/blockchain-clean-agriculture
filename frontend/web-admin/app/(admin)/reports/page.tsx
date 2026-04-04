"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable, StatusBadge, Toast } from "@bicap/ui";
import type { Column } from "@bicap/ui";
import { getAdminReports, resolveReport, type Report } from "@/lib/api";
import { ResolveModal } from "@/components/reports/ResolveModal";

export default function ReportsPage() {
  const qc = useQueryClient();
  const [typeFilter,   setTypeFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected,     setSelected]     = useState<Report | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports", typeFilter, statusFilter],
    queryFn: () =>
      getAdminReports({
        type:   typeFilter   || undefined,
        status: statusFilter || undefined,
      }),
  });

  const resolveMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => resolveReport(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
      setToast({ msg: "Đã resolve báo cáo", type: "success" });
      setSelected(null);
    },
    onError: () => setToast({ msg: "Xử lý thất bại", type: "error" }),
  });

  const COLS: Column<Report>[] = [
    { key: "reporterRole", header: "Người gửi" },
    { key: "type",         header: "Loại" },
    { key: "content",      header: "Nội dung",
      render: (v) => (
        <span className="max-w-xs truncate block text-xs text-gray-600">
          {v as string}
        </span>
      ),
    },
    { key: "status",       header: "Trạng thái",
      render: (v) => <StatusBadge status={v as string} /> },
    { key: "createdAt",    header: "Ngày gửi",
      render: (v) => new Date(v as string).toLocaleDateString("vi-VN") },
    { key: "id",           header: "Hành động",
      render: (_, row) =>
        row.status === "PENDING" ? (
          <button
            onClick={() => setSelected(row)}
            className="rounded-lg bg-green-500 px-3 py-1 text-xs font-medium text-white hover:bg-green-600"
          >
            Xử lý
          </button>
        ) : (
          <span className="text-xs text-gray-400">Đã xử lý</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo</h1>
        <p className="text-sm text-gray-500">Quản lý báo cáo từ mọi Actor</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-400"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ xử lý</option>
          <option value="RESOLVED">Đã xử lý</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-400"
        >
          <option value="">Tất cả loại</option>
          <option value="COMPLAINT">Khiếu nại</option>
          <option value="INCIDENT">Sự cố</option>
          <option value="FEEDBACK">Phản hồi</option>
        </select>
      </div>

      <DataTable<Report>
        columns={COLS}
        data={data?.data ?? []}
        isLoading={isLoading}
        keyField="id"
        emptyMessage="Không có báo cáo nào"
      />

      {selected && (
        <ResolveModal
          report={selected}
          isLoading={resolveMut.isPending}
          onConfirm={(note) => resolveMut.mutate({ id: selected.id, note })}
          onCancel={() => setSelected(null)}
        />
      )}
    </div>
  );
}