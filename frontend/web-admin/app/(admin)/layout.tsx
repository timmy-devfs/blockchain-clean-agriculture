//Lưu ý: Di chuyển dashboard, accounts, farms, contracts, reports vào trong (admin)/ để được bọc bởi layout này.
"use client";

import { ReactNode } from "react";
import { AppShell } from "@bicap/ui";
import { UserRole } from "@bicap/types";
import type { NavItem } from "@bicap/ui";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IconDashboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IconFarm() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function IconContract() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}
function IconReport() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}
function IconOrder() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}
function IconShipping() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",  label: "Dashboard",       icon: <IconDashboard />,  allowedRoles: [UserRole.ADMIN] },
  { href: "/accounts",   label: "Tài khoản",       icon: <IconUsers />,      allowedRoles: [UserRole.ADMIN] },
  { href: "/farms",      label: "Phê duyệt Farm",  icon: <IconFarm />,       allowedRoles: [UserRole.ADMIN] },
  { href: "/seasons",    label: "Duyệt mùa vụ",    icon: <IconFarm />,       allowedRoles: [UserRole.ADMIN] },
  { href: "/orders",     label: "Đơn hàng",        icon: <IconOrder />,      allowedRoles: [UserRole.ADMIN] },
  { href: "/shipments",  label: "Vận chuyển",      icon: <IconShipping />,   allowedRoles: [UserRole.ADMIN] },
  { href: "/contracts",  label: "Smart Contract",  icon: <IconContract />,   allowedRoles: [UserRole.ADMIN] },
  { href: "/reports",    label: "Báo cáo",         icon: <IconReport />,     allowedRoles: [UserRole.ADMIN] },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppShell navItems={NAV_ITEMS}>{children}</AppShell>;
}