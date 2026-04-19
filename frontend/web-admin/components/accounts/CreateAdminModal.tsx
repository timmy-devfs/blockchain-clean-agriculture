"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormInput, Toast } from "@bicap/ui";
import { createAdminUser } from "@/lib/api";

interface Props { onClose: () => void; }

export function CreateAdminModal({ onClose }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ email: "", fullName: "", password: "" });
  const [toast, setToast] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: () => setToast("Tạo tài khoản thất bại"),
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {toast && <Toast message={toast} type="error" onClose={() => setToast(null)} />}
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-5 text-lg font-semibold">Tạo tài khoản Admin</h2>
        <div className="space-y-4">
          <FormInput label="Họ và tên" {...field("fullName")} required />
          <FormInput label="Email" type="email" {...field("email")} required />
          <FormInput label="Mật khẩu" type="password" {...field("password")} required />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
          >
            Hủy
          </button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
            className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-60"
          >
            {mutation.isPending ? "Đang tạo..." : "Tạo tài khoản"}
          </button>
        </div>
      </div>
    </div>
  );
}