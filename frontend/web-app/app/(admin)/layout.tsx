"use client";

import type { ReactNode } from "react";
import { AppShell } from "@bicap/ui";
import type { NavItem } from "@bicap/ui";
import { ProtectedRoute } from "@bicap/auth";
import { UserRole } from "@bicap/types";

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", allowedRoles: [UserRole.ADMIN] },
  { href: "/admin/accounts", label: "Tai khoan", allowedRoles: [UserRole.ADMIN] },
  { href: "/admin/farms", label: "Phe duyet Farm", allowedRoles: [UserRole.ADMIN] },
  { href: "/admin/seasons", label: "Mua vu", allowedRoles: [UserRole.ADMIN] },
  { href: "/admin/orders", label: "Don hang", allowedRoles: [UserRole.ADMIN] },
  { href: "/admin/shipments", label: "Lo van chuyen", allowedRoles: [UserRole.ADMIN] },
  { href: "/admin/contracts", label: "Smart Contract", allowedRoles: [UserRole.ADMIN] },
  { href: "/admin/reports", label: "Bao cao", allowedRoles: [UserRole.ADMIN] },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <AppShell navItems={NAV_ITEMS}>{children}</AppShell>
    </ProtectedRoute>
  );
}
