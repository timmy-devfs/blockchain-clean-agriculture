"use client";

import { useState } from "react";
import type { Report } from "@/lib/api";

interface Props {
  report: Report;
  onConfirm: (adminNote: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function ResolveModal({ report, onConfirm, onCancel, isLoading }: Props) {
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Xử lý báo cáo</h2>

        <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Loại:</span>
            <span className="font-medium">{report.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Người gửi:</span>
            <span className="font-medium">{report.reporterRole}</span>
          </div>
          <div>
            <span className="text-gray-500">Nội dung:</span>
            <p className="mt-1 text-gray-700">{report.content}</p>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-gray-700">
            Ghi chú Admin <span className="text-red-500">*</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nhập ghi chú xử lý..."
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
          />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
          >
            Hủy
          </button>
          <button
            onClick={() => note.trim() && onConfirm(note)}
            disabled={!note.trim() || isLoading}
            className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-60"
          >
            {isLoading ? "Đang xử lý..." : "Đánh dấu Resolved"}
          </button>
        </div>
      </div>
    </div>
  );
}