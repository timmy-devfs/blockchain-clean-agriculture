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

const EXPLORER_TX = "https://explore.vechain.org/transactions";

const FILTERS: Array<{ label: string; value: "pending" | "confirmed" | "all" }> = [
  { label: "Chờ duyệt", value: "pending" },
  { label: "Đã có txHash", value: "confirmed" },
  { label: "Tất cả", value: "all" },
];

export default function AdminSeasonsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "confirmed" | "all">("pending");
  const [approveTarget, setApproveTarget] = useState<AdminSeason | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [pollChain, setPollChain] = useState(false);

  const query = useQuery({
    queryKey: ["admin-seasons", filter],
    queryFn: () => getAdminSeasons(filter),
    refetchInterval: pollChain ? 15_000 : false,
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approveSeasonForBlockchain(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-seasons"] });
      setToast({
        msg: "Đã gửi lên blockchain! txHash sẽ cập nhật sau 5–30 giây.",
        type: "success",
      });
      setApproveTarget(null);
      setPollChain(true);
      window.setTimeout(() => setPollChain(false), 45_000);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Duyệt mùa vụ thất bại";
      setToast({ msg: message, type: "error" });
    },
  });

  const columns = useMemo<Column<AdminSeason>[]>(() => {
    const cols: Column<AdminSeason>[] = [
      {
        key: "cropType",
        header: "Loại cây",
        render: (v, row) => (
          <span className="font-medium text-gray-900">
            {String(v)} · <span className="font-normal text-gray-600">{row.farmName ?? row.farmId}</span>
          </span>
        ),
      },
      {
        key: "province",
        header: "Tỉnh",
        render: (_v, row) => row.province || "—",
      },
      {
        key: "totalYield",
        header: "Sản lượng (ước tính)",
        render: (_v, row) =>
          row.totalYield != null && Number.isFinite(row.totalYield) ? (
            <span>{row.totalYield}</span>
          ) : (
            <span className="text-gray-400">—</span>
          ),
      },
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
        header: "Blockchain",
        render: (v, row) =>
          v ? (
            <div className="space-y-1">
              <Badge className="bg-emerald-100 text-emerald-700">Đã có txHash</Badge>
              <button
                type="button"
                className="block text-xs text-emerald-700 underline-offset-2 hover:underline"
                onClick={() =>
                  window.open(
                    `${EXPLORER_TX}/${String(v)}`,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                title={String(v)}
              >
                {String(v).slice(0, 14)}…
              </button>
            </div>
          ) : (
            <Badge className="bg-amber-100 text-amber-700">Chờ ghi chain</Badge>
          ),
      },
    ];

    if (filter !== "confirmed") {
      cols.push({
        key: "actions",
        header: "Hành động",
        render: (_v, row) => (
          <Button
            size="sm"
            className="h-8 bg-emerald-600 text-xs hover:bg-emerald-700"
            onClick={() => setApproveTarget(row)}
            disabled={!!row.txHash}
          >
            Duyệt
          </Button>
        ),
      });
    }

    return cols;
  }, [filter]);

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle className="text-2xl text-slate-900">Duyệt Vụ mùa</CardTitle>
            <CardDescription>
              Phê duyệt ghi blockchain — sau khi xác nhận, txHash sẽ cập nhật trong vài giây đến vài chục giây.
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
        title="Duyệt vụ mùa"
        message={`Duyệt ghi blockchain cho vụ "${approveTarget?.cropType}" (${approveTarget?.farmName ?? approveTarget?.farmId})?`}
        confirmLabel="Xác nhận duyệt"
        variant="primary"
        onConfirm={() => approveTarget && approveMut.mutate(approveTarget.id)}
        onCancel={() => setApproveTarget(null)}
      />
    </div>
  );
}
