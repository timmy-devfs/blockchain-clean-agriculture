"use client";

import type { ReactNode } from "react";
import { AppShell } from "@bicap/ui";
import type { NavItem } from "@bicap/ui";
import { ProtectedRoute } from "@bicap/auth";
import { UserRole } from "@bicap/types";

const NAV_ITEMS: NavItem[] = [
  { href: "/retailer/dashboard", label: "Dashboard", allowedRoles: [UserRole.RETAILER] },
  { href: "/retailer/marketplace", label: "Tim kiem", allowedRoles: [UserRole.RETAILER] },
  { href: "/retailer/orders", label: "Don hang", allowedRoles: [UserRole.RETAILER] },
  { href: "/retailer/shipments", label: "Van chuyen", allowedRoles: [UserRole.RETAILER] },
];

export default function RetailerLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.RETAILER]}>
      <AppShell navItems={NAV_ITEMS}>{children}</AppShell>
    </ProtectedRoute>
  );
}
