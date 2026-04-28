"use client";

import type { ReactNode } from "react";
import { AppShell } from "@bicap/ui";
import type { NavItem } from "@bicap/ui";
import { ProtectedRoute } from "@bicap/auth";
import { UserRole } from "@bicap/types";

const NAV_ITEMS: NavItem[] = [
  { href: "/farm/dashboard", label: "Dashboard", allowedRoles: [UserRole.FARM_MANAGER] },
  { href: "/farm/seasons", label: "Vu mua", allowedRoles: [UserRole.FARM_MANAGER] },
  { href: "/farm/orders", label: "Don hang", allowedRoles: [UserRole.FARM_MANAGER] },
  { href: "/farm/iot", label: "IoT Monitor", allowedRoles: [UserRole.FARM_MANAGER] },
];

export default function FarmLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.FARM_MANAGER]}>
      <AppShell navItems={NAV_ITEMS}>{children}</AppShell>
    </ProtectedRoute>
  );
}
