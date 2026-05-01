"use client";

import type { ReactNode } from "react";
import { AppShell } from "@bicap/ui";
import type { NavItem } from "@bicap/ui";
import { ProtectedRoute } from "@bicap/auth";
import { UserRole } from "@bicap/types";

// Legacy Farm console (Vite App.tsx) đã có Ant Sider + Header riêng,
// nên ẩn sidebar/padding của AppShell để tránh double-sidebar và UI tràn.
const NAV_ITEMS: NavItem[] = [];

export default function FarmLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.FARM_MANAGER]}>
      <AppShell navItems={NAV_ITEMS} hideSidebar noContentPadding>
        {children}
      </AppShell>
    </ProtectedRoute>
  );
}
