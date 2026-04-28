"use client";

import type { ReactNode } from "react";
import { AppShell } from "@bicap/ui";
import type { NavItem } from "@bicap/ui";
import { ProtectedRoute } from "@bicap/auth";
import { UserRole } from "@bicap/types";

const NAV_ITEMS: NavItem[] = [
  { href: "/shipping/dashboard", label: "Dashboard", allowedRoles: [UserRole.SHIPPING_MANAGER] },
  { href: "/shipping/shipments", label: "Chuyen hang", allowedRoles: [UserRole.SHIPPING_MANAGER] },
  { href: "/shipping/drivers", label: "Tai xe", allowedRoles: [UserRole.SHIPPING_MANAGER] },
  { href: "/shipping/vehicles", label: "Phuong tien", allowedRoles: [UserRole.SHIPPING_MANAGER] },
];

export default function ShippingLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.SHIPPING_MANAGER]}>
      <AppShell navItems={NAV_ITEMS}>{children}</AppShell>
    </ProtectedRoute>
  );
}
