"use client";

import type { ReactNode } from "react";
import { AppShell } from "@bicap/ui";
import type { NavItem } from "@bicap/ui";
import { ProtectedRoute } from "@bicap/auth";
import { UserRole } from "@bicap/types";

const SHIPPING_ROLES = [
  UserRole.SHIPPING_MANAGER,
  UserRole.SHIP_DRIVER,
  UserRole.SHIPPER,
];

// Legacy Shipping console đã có sidebar fixed riêng (228px),
// nên ẩn sidebar/padding của AppShell để tránh chồng UI.
const NAV_ITEMS: NavItem[] = [];

export default function ShippingLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell navItems={NAV_ITEMS} hideSidebar noContentPadding>
      {children}
    </AppShell>
  );
}
