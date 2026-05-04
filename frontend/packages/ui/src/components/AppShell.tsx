"use client";

import React from "react";
import { Sidebar, NavItem } from "./Sidebar";
import { useAuth } from "@bicap/auth";

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  logo?: React.ReactNode;
  /**
   * Bỏ qua sidebar bên trái (dùng cho legacy console farm/retailer/shipping
   * vốn đã có sidebar riêng từ Ant Design, tránh double sidebar / tràn UI).
   */
  hideSidebar?: boolean;
  /**
   * Bỏ padding 24px ở main để legacy console có thể chiếm full viewport
   * (legacy farm/retailer/shipping tự quản lý padding nội bộ).
   */
  noContentPadding?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN:            "Admin",
  FARM_MANAGER:     "Farm Manager",
  RETAILER:         "Retailer",
  SHIP_DRIVER:      "Driver",
  SHIPPING_MANAGER: "Shipping Mgr",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN:            "bg-violet-500/10 text-violet-300 border-violet-500/30",
  FARM_MANAGER:     "bg-green-500/10 text-green-300 border-green-500/30",
  RETAILER:         "bg-blue-500/10 text-blue-300 border-blue-500/30",
  SHIP_DRIVER:      "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  SHIPPING_MANAGER: "bg-teal-500/10 text-teal-300 border-teal-500/30",
};

export function AppShell({
  children,
  navItems,
  logo,
  hideSidebar = false,
  noContentPadding = false,
}: AppShellProps) {
  const { user, role, logout } = useAuth();

  const roleStr = role as string | null;
  const roleLabel = roleStr ? (ROLE_LABELS[roleStr] ?? roleStr) : null;
  const roleColor = roleStr ? (ROLE_COLORS[roleStr] ?? "bg-gray-500/10 text-gray-300 border-gray-500/30") : "";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {!hideSidebar && <Sidebar navItems={navItems} logo={logo} />}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
          {/* Left: breadcrumb hint */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
              BICAP
            </span>
            <span className="text-gray-300">/</span>
            <span className="text-xs text-gray-500">Blockchain Clean Agriculture</span>
          </div>

          {/* Right: user info */}
          <div className="flex items-center gap-3">
            {roleLabel && (
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleColor}`}>
                {roleLabel}
              </span>
            )}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-xs font-bold text-white shadow">
                {user?.fullName?.[0]?.toUpperCase() ?? "A"}
              </div>
              <span className="max-w-[140px] truncate text-sm font-medium text-gray-700">
                {user?.fullName ?? "—"}
              </span>
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className={`flex-1 overflow-y-auto ${noContentPadding ? "" : "p-6"}`}>{children}</main>
      </div>
    </div>
  );
}