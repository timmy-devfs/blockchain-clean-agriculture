"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@bicap/auth";
import type { UserRole } from "@bicap/types";

export interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
  allowedRoles?: UserRole[];
}

interface SidebarProps {
  navItems: NavItem[];
  logo?: React.ReactNode;
}

export function Sidebar({ navItems, logo }: SidebarProps) {
  const pathname = usePathname();
  const { role } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.allowedRoles || (role && item.allowedRoles.includes(role))
  );

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-gray-900 text-white">
      {/* Logo area */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-700/60 px-5">
        {logo ?? (
          <>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-900/30">
              <span className="text-sm font-black text-white">B</span>
            </div>
            <div className="leading-none">
              <p className="text-sm font-bold text-white">BICAP</p>
              <p className="text-[10px] text-gray-400">Admin Panel</p>
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
          Menu chính
        </p>
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-green-500 text-white shadow-md shadow-green-900/30"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  {item.icon && (
                    <span className={`shrink-0 transition-transform duration-150 ${isActive ? "" : "group-hover:scale-110"}`}>
                      {item.icon}
                    </span>
                  )}
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/50" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-700/60 px-5 py-3">
        <p className="text-[10px] text-gray-600">BICAP v1.0 — Blockchain Clean Agriculture</p>
      </div>
    </aside>
  );
}