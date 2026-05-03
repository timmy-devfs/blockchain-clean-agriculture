"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Toast } from "@bicap/ui";
import {
  createOwnerSeason,
  getAxiosErrorMessage,
  getOwnerFarms,
} from "@/lib/api";

const CROP_OPTIONS = ["Lúa", "Rau", "Trái cây", "Thủy sản", "Gia cầm", "Khác"] as const;
const YIELD_UNITS = ["kg", "tấn", "thùng"] as const;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateSeasonModal({ isOpen, onClose }: Props) {
  const qc = useQueryClient();
  const farmsQ = useQuery({ queryKey: ["owner-farms"], queryFn: getOwnerFarms });
  const approvedFarms = useMemo(
    () =>
      (farmsQ.data ?? []).filter(
        (f) => f.status === "APPROVED" || f.isApproved
      ),
    [farmsQ.data]
  );

  const [farmId, setFarmId] = useState("");
  const [cropType, setCropType] = useState<string>(CROP_OPTIONS[0] ?? "Lúa");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState<(typeof YIELD_UNITS)[number]>("kg");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(
    null
  );

  const mut = useMutation({
    mutationFn: async () => {
      const qtyNum = Number(qty.replace(",", "."));
      return createOwnerSeason(
        {
          farmId,
          cropType,
          startDate: new Date(startDate).toISOString(),
          estimatedEndDate:
            endDate.trim() === ""
              ? undefined
              : new Date(endDate).toISOString(),
        },
        {
          estimatedYield:
            qty.trim() && Number.isFinite(qtyNum) && qtyNum > 0
              ? qtyNum
              : undefined,
        }
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["owner-farms"] });
      void qc.invalidateQueries({ queryKey: ["owner-seasons"] });
      setToast({
        msg: "Đã tạo vụ mùa! Chờ Admin duyệt để ghi blockchain.",
        type: "success",
      });
      setFarmId("");
      setStartDate("");
      setEndDate("");
      setQty("");
      onClose();
    },
    onError: (err) =>
      setToast({
        msg: getAxiosErrorMessage(err, "Không tạo được vụ mùa"),
        type: "error",
      }),
  });

  if (!isOpen) return null;

  const qtyNum = Number(qty.replace(",", "."));
  const valid =
    farmId &&
    cropType &&
    startDate &&
    (!qty.trim() || (Number.isFinite(qtyNum) && qtyNum > 0));

  return (
    <>
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-900">Tạo vụ mùa</h2>
          <p className="mt-1 text-sm text-gray-500">
            Chỉ chọn farm đã được Admin phê duyệt.
          </p>

          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Trang trại <span className="text-red-500">*</span>
              <select
                value={farmId}
                onChange={(e) => setFarmId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">— Chọn farm đã duyệt —</option>
                {approvedFarms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.farmName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Loại cây trồng <span className="text-red-500">*</span>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                {CROP_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-gray-700">
                Ngày bắt đầu <span className="text-red-500">*</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Ngày dự kiến kết thúc
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-gray-700">
                Sản lượng ước tính
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="VD: 12"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Đơn vị
                <select
                  value={unit}
                  onChange={(e) =>
                    setUnit(e.target.value as (typeof YIELD_UNITS)[number])
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  {YIELD_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!valid || mut.isPending || approvedFarms.length === 0}
              onClick={() => mut.mutate()}
            >
              {mut.isPending ? "Đang gửi…" : "Tạo vụ mùa"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
