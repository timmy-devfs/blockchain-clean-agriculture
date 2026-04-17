"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable, ConfirmDialog, Toast } from "@bicap/ui";
import type { Column } from "@bicap/ui";
import type { Farm } from "@bicap/types";
import { getAdminFarms, approveFarm, rejectFarm, type FarmStatus } from "@/lib/api";
import { RejectModal } from "@/components/farms/RejectModal";
import Link from "next/link";

const TABS: { label: string; value: FarmStatus }[] = [
  { label: "Chờ duyệt",  value: "PENDING"  },
  { label: "Đã duyệt",   value: "APPROVED" },
  { label: "Từ chối",    value: "REJECTED" },
];

export default function FarmsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<FarmStatus>("PENDING");
  const [approveTarget, setApproveTarget] = useState<Farm | null>(null);
  const [rejectTarget,  setRejectTarget]  = useState<Farm | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-farms", activeTab],
    queryFn: () => getAdminFarms(activeTab),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approveFarm(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-farms"] });
      setToast({ msg: "Đã phê duyệt trang trại", type: "success" });
      setApproveTarget(null);
    },
    onError: () => setToast({ msg: "Phê duyệt thất bại", type: "error" }),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectFarm(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-farms"] });
      setToast({ msg: "Đã từ chối trang trại", type: "success" });
      setRejectTarget(null);
    },
    onError: () => setToast({ msg: "Từ chối thất bại", type: "error" }),
  });

  const COLS: Column<Farm>[] = [
    { key: "farmName",  header: "Tên trang trại" },
    { key: "province",  header: "Tỉnh/Thành" },
    { key: "totalArea", header: "Diện tích (ha)" },
    { key: "createdAt", header: "Ngày đăng ký",
      render: (v) => new Date(v as string).toLocaleDateString("vi-VN") },
    { key: "id", header: "Chi tiết",
      render: (_, row) => (
        <Link
          href={`/farms/${row.id}`}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Xem →
        </Link>
      ),
    },
    ...(activeTab === "PENDING"
      ? [{
          key: "id" as keyof Farm,
          header: "Hành động",
          render: (_: unknown, row: Farm) => (
            <div className="flex gap-2">
              <button
                onClick={() => setApproveTarget(row)}
                className="rounded-lg bg-green-500 px-3 py-1 text-xs font-medium text-white hover:bg-green-600"
              >
                Duyệt
              </button>
              <button
                onClick={() => setRejectTarget(row)}
                className="rounded-lg bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600"
              >
                Từ chối
              </button>
            </div>
          ),
        }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Farm</h1>
        <p className="text-sm text-gray-500">Phê duyệt đăng ký trang trại</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable<Farm>
        columns={COLS}
        data={data?.data ?? []}
        isLoading={isLoading}
        keyField="id"
        emptyMessage="Không có farm nào"
      />

      {/* Approve Confirm */}
      <ConfirmDialog
        isOpen={!!approveTarget}
        title="Phê duyệt trang trại"
        message={`Xác nhận phê duyệt "${approveTarget?.farmName}"?`}
        confirmLabel="Phê duyệt"
        onConfirm={() => approveTarget && approveMut.mutate(approveTarget.id)}
        onCancel={() => setApproveTarget(null)}
      />

      {/* Reject Modal */}
      {rejectTarget && (
        <RejectModal
          farmName={rejectTarget.farmName}
          isLoading={rejectMut.isPending}
          onConfirm={(reason) => rejectMut.mutate({ id: rejectTarget.id, reason })}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}