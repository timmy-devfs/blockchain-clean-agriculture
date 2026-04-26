"use client";

import React, { useEffect } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number; // ms
  onClose: () => void;
}

const TOAST_CONFIG: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: "bg-emerald-600",  icon: "✓" },
  error:   { bg: "bg-rose-600",     icon: "✕" },
  warning: { bg: "bg-amber-500",    icon: "⚠" },
  info:    { bg: "bg-sky-600",      icon: "ℹ" },
};

export function Toast({ message, type = "info", duration = 3500, onClose }: ToastProps) {
  const { bg, icon } = TOAST_CONFIG[type];

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed bottom-5 right-5 z-[9999] flex items-center gap-3 rounded-xl px-4 py-3 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-sm ${bg} animate-slide-in`}
      style={{ minWidth: 260 }}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium leading-snug">{message}</span>
      <button
        onClick={onClose}
        className="ml-1 rounded-lg p-1 text-white/70 transition hover:bg-white/20 hover:text-white"
        aria-label="Đóng"
      >
        ✕
      </button>
    </div>
  );
}