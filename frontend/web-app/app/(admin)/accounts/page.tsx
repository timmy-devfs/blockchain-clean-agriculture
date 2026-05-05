"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable, StatusBadge, ConfirmDialog, Toast, SearchInput } from "@bicap/ui";
import type { Column } from "@bicap/ui";
import type { User } from "@bicap/types";
import { getAdminUsers, updateUser } from "@/lib/api";
import { CreateAdminModal } from "@/components/admin/accounts/CreateAdminModal";

const PAGE_SIZE = 10;

const ROLE_OPTIONS = [
  { value: "",               label: "Tất cả vai trò" },
  { value: "ADMIN",          label: "Admin" },
  { value: "FARM_MANAGER",   label: "Farm Manager" },
  { value: "RETAILER",       label: "Nhà bán lẻ" },
  { value: "SHIP_DRIVER",    label: "Tài xế" },
  { value: "SHIPPING_MANAGER", label: "Q.Lý vận chuyển" },
];

export default function AccountsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, PAGE_SIZE, roleFilter, search],
    queryFn: () => getAdminUsers({ page, size: PAGE_SIZE, role: roleFilter || undefined, search: search || undefined }),
  });

  const toggleMutation = useMutation({
    mutationFn: (user: User) =>
      updateUser(user.id, { isActive: !user.isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setToast({ msg: "Cập nhật thành công", type: "success" });
      setTargetUser(null);
    },
    onError: () => setToast({ msg: "Cập nhật thất bại", type: "error" }),
  });

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    setPage(0);
  }, []);

  const COLS: Column<User>[] = [
    { key: "fullName", header: "Họ tên" },
    { key: "email",    header: "Email",
      render: (v) => <span className="font-mono text-xs text-gray-600">{v as string}</span> },
    { key: "role",     header: "Vai trò",
      render: (v) => <StatusBadge status={v as string} /> },
    { key: "isActive", header: "Trạng thái",
      render: (v) => (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${v ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${v ? "bg-emerald-500" : "bg-red-500"}`} />
          {v ? "Hoạt động" : "Vô hiệu"}
        </span>
      ),
    },
    { key: "createdAt", header: "Ngày tạo",
      render: (v) => <span className="text-xs text-gray-500">{new Date(v as string).toLocaleDateString("vi-VN")}</span> },
    { key: "id", header: "Hành động",
      render: (_, row) => (
        <button
          onClick={() => setTargetUser(row)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition ${
            row.isActive ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"
          }`}
        >
          {row.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tài khoản</h1>
          <p className="text-sm text-gray-500">Danh sách tất cả tài khoản trong hệ thống</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        >
          + Tạo Admin
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Tìm theo email, họ tên..."
          onSearch={handleSearch}
          className="w-72"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {(roleFilter || search) && (
          <button
            onClick={() => { setRoleFilter(""); setSearch(""); setPage(0); }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition"
          >
            Xóa bộ lọc ✕
          </button>
        )}
      </div>

      <DataTable<User>
        columns={COLS}
        data={data?.data ?? []}
        isLoading={isLoading}
        keyField="id"
        emptyMessage="Chưa có tài khoản nào"
      />

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
        <span>
          Tổng <strong className="text-gray-800">{data?.total ?? 0}</strong> tài khoản
          — Trang <strong className="text-gray-800">{(data?.page ?? page) + 1}</strong> / {Math.max(1, data?.totalPages ?? 1)}
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={page <= 0 || isLoading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition"
          >
            ← Trước
          </button>
          <button
            type="button"
            disabled={isLoading || page >= (data?.totalPages ?? 1) - 1 || (data?.totalPages ?? 1) <= 0}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition"
          >
            Sau →
          </button>
        </div>
      </div>

      {showCreate && <CreateAdminModal onClose={() => setShowCreate(false)} />}

      <ConfirmDialog
        isOpen={!!targetUser}
        title={targetUser?.isActive ? "Vô hiệu hóa tài khoản" : "Kích hoạt tài khoản"}
        message={`Bạn có chắc muốn ${targetUser?.isActive ? "vô hiệu hóa" : "kích hoạt"} tài khoản "${targetUser?.fullName}"?`}
        variant={targetUser?.isActive ? "danger" : "primary"}
        confirmLabel={targetUser?.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
        onConfirm={() => targetUser && toggleMutation.mutate(targetUser)}
        onCancel={() => setTargetUser(null)}
      />
    </div>
  );
}
