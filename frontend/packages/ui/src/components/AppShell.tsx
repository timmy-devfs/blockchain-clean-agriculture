"use client";

import React from "react";
import { Sidebar, NavItem } from "./Sidebar";
import { useAuth } from "@bicap/auth";

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  logo?: React.ReactNode;
}

export function AppShell({ children, navItems, logo }: AppShellProps) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar navItems={navItems} logo={logo} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
          <h1 className="text-sm font-medium text-gray-500">
            BICAP — Blockchain Clean Agriculture
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{user?.fullName}</span>
            <button
              onClick={logout}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Đăng xuất
            </button>
          </div>
        </header>
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}