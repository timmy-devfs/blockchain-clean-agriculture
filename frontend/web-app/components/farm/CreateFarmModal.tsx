"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Toast } from "@bicap/ui";
import { createOwnerFarm, getAxiosErrorMessage, type CreateFarmPayload } from "@/lib/api";
import { VN_PROVINCES } from "@/lib/vn-provinces";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateFarmModal({ isOpen, onClose }: Props) {
  const qc = useQueryClient();
  const [farmName, setFarmName] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [area, setArea] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(
    null
  );

  const mut = useMutation({
    mutationFn: (payload: CreateFarmPayload) => createOwnerFarm(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["owner-farms"] });
      setToast({
        msg: "Đã tạo farm! Chờ Admin duyệt.",
        type: "success",
      });
      setFarmName("");
      setAddress("");
      setProvince("");
      setArea("");
      onClose();
    },
    onError: (err) =>
      setToast({
        msg: getAxiosErrorMessage(err, "Không tạo được farm"),
        type: "error",
      }),
  });

  if (!isOpen) return null;

  const areaNum = Number(area.replace(",", "."));
  const valid =
    farmName.trim() &&
    address.trim() &&
    province.trim() &&
    Number.isFinite(areaNum) &&
    areaNum > 0;

  const submit = () => {
    if (!valid) return;
    mut.mutate({
      name: farmName.trim(),
      address: address.trim(),
      province: province.trim(),
      area: areaNum,
    });
  };

  return (
    <>
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-900">Tạo trang trại mới</h2>
          <p className="mt-1 text-sm text-gray-500">
            Sau khi gửi, Admin sẽ duyệt trước khi bạn tạo vụ mùa.
          </p>

          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Tên trang trại <span className="text-red-500">*</span>
              <input
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="VD: HTX Lúa Xanh"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Địa chỉ <span className="text-red-500">*</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="Ấp / Xã / Đường…"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Tỉnh / Thành <span className="text-red-500">*</span>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">— Chọn —</option>
                {VN_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Diện tích (ha) <span className="text-red-500">*</span>
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!valid || mut.isPending}
              onClick={submit}
            >
              {mut.isPending ? "Đang gửi…" : "Tạo farm"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
