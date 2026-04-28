"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DataTable,
  StatusBadge,
  ConfirmDialog,
  Toast,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from "@bicap/ui";
import type { Column } from "@bicap/ui";
import type { Farm } from "@bicap/types";
import { getAdminFarms, approveFarm, rejectFarm, type FarmStatus } from "@/lib/api";
import { RejectModal } from "@/components/admin/farms/RejectModal";
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

  // Fetch all 3 tabs for count badges
  const queryPending  = useQuery({ queryKey: ["admin-farms", "PENDING"],  queryFn: () => getAdminFarms("PENDING") });
  const queryApproved = useQuery({ queryKey: ["admin-farms", "APPROVED"], queryFn: () => getAdminFarms("APPROVED") });
  const queryRejected = useQuery({ queryKey: ["admin-farms", "REJECTED"], queryFn: () => getAdminFarms("REJECTED") });

  const tabQueries = { PENDING: queryPending, APPROVED: queryApproved, REJECTED: queryRejected };
  const activeQuery = tabQueries[activeTab];
  const { data, isLoading, isError, refetch, error } = activeQuery;

  const TAB_STATUS_COLOR: Record<FarmStatus, string> = {
    PENDING:  "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  const approveMut = useMutation({
    mutationFn: (id: string) => approveFarm(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-farms"] });
      setToast({ msg: "Đã phê duyệt trang trại ✓", type: "success" });
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

  useEffect(() => {
    if (!isError) return;
    const message =
      error instanceof Error
        ? `Không tải được dữ liệu farm: ${error.message}`
        : "Không tải được dữ liệu farm, vui lòng thử lại.";
    setToast({ msg: message, type: "error" });
  }, [isError, error]);

  const COLS: Column<Farm>[] = [
    { key: "farmName",  header: "Tên trang trại" },
    { key: "province",  header: "Tỉnh/Thành" },
    { key: "totalArea", header: "Diện tích (ha)",
      render: (v) => <span className="font-medium">{v as number} ha</span> },
    { key: "status",    header: "Trạng thái",
      render: (v) => <StatusBadge status={v as string} /> },
    { key: "createdAt", header: "Ngày đăng ký",
      render: (v) => <span className="text-xs text-gray-500">{new Date(v as string).toLocaleDateString("vi-VN")}</span> },
    { key: "id", header: "Chi tiết",
      render: (_, row) => (
        <Link
          href={`/admin/farms/${row.id}`}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition"
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
              <Button
                onClick={() => setApproveTarget(row)}
                size="sm"
                className="h-8 bg-emerald-600 text-xs hover:bg-emerald-700"
              >
                ✓ Duyệt
              </Button>
              <Button
                onClick={() => setRejectTarget(row)}
                variant="destructive"
                size="sm"
                className="h-8 text-xs"
              >
                ✕ Từ chối
              </Button>
            </div>
          ),
        }]
      : []),
  ];

  return (
    <div className="space-y-5">
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle className="text-2xl text-slate-900">Quản lý Farm</CardTitle>
            <CardDescription>Phê duyệt đăng ký trang trại qua API Gateway</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const count = tabQueries[tab.value].data?.total;
              const isActive = activeTab === tab.value;
              return (
                <Button
                  key={tab.value}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.value)}
                  className="gap-2"
                >
                  {tab.label}
                  {count != null && count > 0 && (
                    <Badge className={isActive ? TAB_STATUS_COLOR[tab.value] : "bg-slate-100 text-slate-600"}>
                      {count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-rose-200 bg-rose-50/70 p-6 text-center">
              <p className="text-sm font-medium text-rose-700">Không thể tải danh sách farm cho tab hiện tại.</p>
              <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                Thử tải lại
              </Button>
            </div>
          ) : (
            <DataTable<Farm>
              columns={COLS}
              data={data?.data ?? []}
              isLoading={isLoading}
              keyField="id"
              emptyMessage="Không có farm nào"
            />
          )}
        </CardContent>
      </Card>

      {/* Approve Confirm */}
      <ConfirmDialog
        isOpen={!!approveTarget}
        title="Phê duyệt trang trại"
        message={`Xác nhận phê duyệt "${approveTarget?.farmName}"? Farm sẽ có thể hoạt động trên hệ thống.`}
        confirmLabel="Phê duyệt"
        variant="primary"
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
