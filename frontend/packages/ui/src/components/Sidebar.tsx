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
    <aside className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center border-b border-gray-700 px-6">
        {logo ?? <span className="text-lg font-bold text-green-400">BICAP</span>}
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-green-500 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}