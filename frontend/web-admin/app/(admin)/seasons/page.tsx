"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataTable,
  Toast,
} from "@bicap/ui";
import type { Column } from "@bicap/ui";
import { approveSeasonForBlockchain, getAdminSeasons, type AdminSeason } from "@/lib/api";

const EXPLORER_BASE = "https://explore.vechain.org/fr/transactions";

const FILTERS: Array<{ label: string; value: "pending" | "confirmed" | "all" }> = [
  { label: "Chờ duyệt chain", value: "pending" },
  { label: "Đã ghi chain", value: "confirmed" },
  { label: "Tất cả", value: "all" },
];

export default function AdminSeasonsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "confirmed" | "all">("pending");
  const [approveTarget, setApproveTarget] = useState<AdminSeason | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const query = useQuery({
    queryKey: ["admin-seasons", filter],
    queryFn: () => getAdminSeasons(filter),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approveSeasonForBlockchain(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-seasons"] });
      setToast({ msg: "Đã duyệt mùa vụ, sự kiện ghi blockchain đã được gửi", type: "success" });
      setApproveTarget(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Duyệt mùa vụ thất bại";
      setToast({ msg: message, type: "error" });
    },
  });

  const openSeasonExplorer = (season: AdminSeason) => {
    if (!season.txHash) {
      setToast({ msg: "Mùa vụ này chưa có txHash để mở VeChain Explorer", type: "error" });
      return;
    }
    window.open(`${EXPLORER_BASE}/${season.txHash}`, "_blank", "noopener,noreferrer");
  };

  const columns = useMemo<Column<AdminSeason>[]>(() => ([
    {
      key: "id",
      header: "Season ID",
      render: (_, row) => (
        <button
          type="button"
          onClick={() => openSeasonExplorer(row)}
          className="font-medium text-emerald-700 underline-offset-2 hover:underline"
          title={row.txHash ? "Mở giao dịch trên VeChain Explorer" : "Chưa có txHash"}
        >
          {row.id}
        </button>
      ),
    },
    { key: "farmId", header: "Farm ID" },
    { key: "cropType", header: "Loại cây" },
    { key: "status", header: "Trạng thái mùa vụ" },
    {
      key: "createdAt",
      header: "Ngày tạo",
      render: (v) => (
        <span className="text-xs text-gray-500">
          {new Date(String(v)).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      key: "txHash",
      header: "Trạng thái chain",
      render: (v) =>
        v ? (
          <div className="space-y-1">
            <Badge className="bg-emerald-100 text-emerald-700">Đã callback chain</Badge>
            <button
              type="button"
              className="text-xs text-emerald-700 underline-offset-2 hover:underline"
              onClick={() => window.open(`${EXPLORER_BASE}/${String(v)}`, "_blank", "noopener,noreferrer")}
              title={String(v)}
            >
              {String(v).slice(0, 12)}...
            </button>
          </div>
        ) : (
          <Badge className="bg-amber-100 text-amber-700">Chờ duyệt ghi chain</Badge>
        ),
    },
    ...(filter !== "confirmed"
      ? [{
          key: "id" as keyof AdminSeason,
          header: "Hành động",
          render: (_: unknown, row: AdminSeason) => (
            <Button
              size="sm"
              className="h-8 bg-emerald-600 text-xs hover:bg-emerald-700"
              onClick={() => setApproveTarget(row)}
              disabled={!!row.txHash}
            >
              Duyệt ghi chain
            </Button>
          ),
        }]
      : []),
  ]), [filter]);

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle className="text-2xl text-slate-900">Duyệt mùa vụ lên blockchain</CardTitle>
            <CardDescription>
              Luồng mới: tạo mùa vụ ở web-farm, admin duyệt tại đây rồi mới publish sang blockchain-service.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <Button
                key={item.value}
                variant={filter === item.value ? "default" : "outline"}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<AdminSeason>
            columns={columns}
            data={query.data ?? []}
            isLoading={query.isLoading}
            keyField="id"
            emptyMessage="Không có mùa vụ phù hợp"
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={!!approveTarget}
        title="Duyệt mùa vụ ghi blockchain"
        message={`Xác nhận duyệt mùa vụ "${approveTarget?.id}" để gửi event ghi blockchain?`}
        confirmLabel="Xác nhận duyệt"
        variant="primary"
        onConfirm={() => approveTarget && approveMut.mutate(approveTarget.id)}
        onCancel={() => setApproveTarget(null)}
      />
    </div>
  );
}
