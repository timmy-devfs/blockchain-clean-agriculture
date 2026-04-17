//Lưu ý: Di chuyển dashboard, accounts, farms, contracts, reports vào trong (admin)/ để được bọc bởi layout này.
"use client";

import { ReactNode } from "react";
import { AppShell } from "@bicap/ui";
import { UserRole } from "@bicap/types";
import type { NavItem } from "@bicap/ui";

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",  label: "Dashboard",       allowedRoles: [UserRole.ADMIN] },
  { href: "/accounts",   label: "Tài khoản",       allowedRoles: [UserRole.ADMIN] },
  { href: "/farms",      label: "Phê duyệt Farm",  allowedRoles: [UserRole.ADMIN] },
  { href: "/contracts",  label: "Smart Contract",  allowedRoles: [UserRole.ADMIN] },
  { href: "/reports",    label: "Báo cáo",         allowedRoles: [UserRole.ADMIN] },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppShell navItems={NAV_ITEMS}>{children}</AppShell>;
}