"use client";

import React from "react";

type DialogVariant = "primary" | "danger" | "warning";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_CONFIG: Record<DialogVariant, { icon: string; iconBg: string; btnClass: string }> = {
  primary: {
    icon: "✓",
    iconBg: "bg-green-100 text-green-600",
    btnClass: "bg-green-500 hover:bg-green-600 focus:ring-green-500",
  },
  danger: {
    icon: "⚠",
    iconBg: "bg-red-100 text-red-600",
    btnClass: "bg-red-500 hover:bg-red-600 focus:ring-red-500",
  },
  warning: {
    icon: "⚠",
    iconBg: "bg-amber-100 text-amber-600",
    btnClass: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-500",
  },
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  variant = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const { icon, iconBg, btnClass } = VARIANT_CONFIG[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5 animate-slide-in">
        {/* Icon */}
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold ${iconBg}`}>
          {icon}
        </div>

        <h2 className="text-center text-base font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-center text-sm text-gray-500 leading-relaxed">{message}</p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-1 ${btnClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}