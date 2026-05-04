"use client";

import type { ReactNode } from "react";
import { AppShell } from "@bicap/ui";
import type { NavItem } from "@bicap/ui";

// Legacy Farm console (Vite App.tsx) đã có Ant Sider + Header riêng,
// nên ẩn sidebar/padding của AppShell để tránh double-sidebar và UI tràn.
// Role gate: ProtectedRoute trên từng page trong app/(farm)/farm/**.
const NAV_ITEMS: NavItem[] = [];

export default function FarmLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell navItems={NAV_ITEMS} hideSidebar={true} noContentPadding={true}>
      {children}
    </AppShell>
  );
}
