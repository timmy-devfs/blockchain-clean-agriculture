"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Toast } from "@bicap/ui";
import { SeasonStatus } from "@bicap/types";
import { getAxiosErrorMessage, postSeasonUpdate } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  seasonId: string;
  cropLabel: string;
}

const STATUS_OPTIONS: SeasonStatus[] = [
  SeasonStatus.PREPARING,
  SeasonStatus.ACTIVE,
  SeasonStatus.HARVESTED,
  SeasonStatus.EXPORTED,
];

export function SeasonUpdateModal({
  isOpen,
  onClose,
  seasonId,
  cropLabel,
}: Props) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<SeasonStatus>(SeasonStatus.ACTIVE);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(
    null
  );

  const mut = useMutation({
    mutationFn: () =>
      postSeasonUpdate(seasonId, {
        status,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["owner-seasons"] });
      setToast({ msg: "Đã cập nhật tiến trình vụ mùa.", type: "success" });
      setNote("");
      onClose();
    },
    onError: (err) =>
      setToast({
        msg: getAxiosErrorMessage(err, "Cập nhật thất bại"),
        type: "error",
      }),
  });

  if (!isOpen) return null;

  return (
    <>
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-900">Cập nhật tiến trình</h2>
          <p className="mt-1 text-sm text-gray-500">{cropLabel}</p>
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Trạng thái vụ mùa
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SeasonStatus)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Ghi chú (tuỳ chọn)
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
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
              disabled={mut.isPending}
              onClick={() => mut.mutate()}
            >
              {mut.isPending ? "Đang lưu…" : "Lưu"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
