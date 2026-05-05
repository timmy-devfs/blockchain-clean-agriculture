"use client";

import type { ReactNode } from "react";
import { AppShell } from "@bicap/ui";
import type { NavItem } from "@bicap/ui";
import { ProtectedRoute } from "@bicap/auth";
import { UserRole } from "@bicap/types";

// Legacy Retailer console (Vite App.tsx) đã có Ant Sider + Header riêng,
// nên ẩn sidebar/padding của AppShell để tránh double-sidebar và tab tràn.
const NAV_ITEMS: NavItem[] = [];

export default function RetailerLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.RETAILER]}>
      <AppShell navItems={NAV_ITEMS} hideSidebar noContentPadding>
        {children}
      </AppShell>
    </ProtectedRoute>
  );
}
