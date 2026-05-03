"use client";

import type { ReactNode } from "react";
import { AppShell } from "@bicap/ui";
import type { NavItem } from "@bicap/ui";
import { ProtectedRoute } from "@bicap/auth";
import { UserRole } from "@bicap/types";

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", allowedRoles: [UserRole.ADMIN] },
  { href: "/admin/accounts", label: "Tài khoản", allowedRoles: [UserRole.ADMIN] },
  { href: "/admin/farms", label: "Phê duyệt farm", allowedRoles: [UserRole.ADMIN] },
  { href: "/admin/seasons", label: "Duyệt vụ mùa", allowedRoles: [UserRole.ADMIN] },
  { href: "/admin/orders", label: "Đơn hàng", allowedRoles: [UserRole.ADMIN] },
  { href: "/admin/shipments", label: "Vận chuyển", allowedRoles: [UserRole.ADMIN] },
  { href: "/admin/contracts", label: "Smart contract", allowedRoles: [UserRole.ADMIN] },
  { href: "/admin/reports", label: "Báo cáo", allowedRoles: [UserRole.ADMIN] },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <AppShell navItems={NAV_ITEMS}>{children}</AppShell>
    </ProtectedRoute>
  );
}
