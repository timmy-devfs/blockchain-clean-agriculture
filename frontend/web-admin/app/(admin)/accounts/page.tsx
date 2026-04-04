"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable, StatusBadge, ConfirmDialog, Toast } from "@bicap/ui";
import type { Column } from "@bicap/ui";
import type { User } from "@bicap/types";
import { getAdminUsers, updateUser } from "@/lib/api";
import { CreateAdminModal } from "@/components/accounts/CreateAdminModal";

export default function AccountsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => getAdminUsers(),
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

  const COLS: Column<User>[] = [
    { key: "fullName", header: "Họ tên" },
    { key: "email",    header: "Email" },
    { key: "role",     header: "Vai trò",
      render: (v) => <StatusBadge status={v as string} /> },
    { key: "isActive", header: "Trạng thái",
      render: (v) => (
        <span className={`text-xs font-medium ${v ? "text-green-600" : "text-red-500"}`}>
          {v ? "Hoạt động" : "Vô hiệu"}
        </span>
      ),
    },
    { key: "createdAt", header: "Ngày tạo",
      render: (v) => new Date(v as string).toLocaleDateString("vi-VN") },
    { key: "id", header: "Hành động",
      render: (_, row) => (
        <button
          onClick={() => setTargetUser(row)}
          className={`rounded-lg px-3 py-1 text-xs font-medium text-white ${
            row.isActive ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {row.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tài khoản</h1>
          <p className="text-sm text-gray-500">Danh sách tài khoản Admin hệ thống</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
        >
          + Tạo Admin
        </button>
      </div>

      <DataTable<User>
        columns={COLS}
        data={data?.data ?? []}
        isLoading={isLoading}
        keyField="id"
        emptyMessage="Chưa có tài khoản nào"
      />

      {showCreate && <CreateAdminModal onClose={() => setShowCreate(false)} />}

      <ConfirmDialog
        isOpen={!!targetUser}
        title={targetUser?.isActive ? "Vô hiệu hóa tài khoản" : "Kích hoạt tài khoản"}
        message={`Bạn có chắc muốn ${targetUser?.isActive ? "vô hiệu hóa" : "kích hoạt"} tài khoản "${targetUser?.fullName}"?`}
        variant={targetUser?.isActive ? "danger" : "primary"}
        onConfirm={() => targetUser && toggleMutation.mutate(targetUser)}
        onCancel={() => setTargetUser(null)}
      />
    </div>
  );
}