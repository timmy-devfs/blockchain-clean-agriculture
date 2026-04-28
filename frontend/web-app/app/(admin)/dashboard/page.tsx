"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { StatCard, DataTable } from "@bicap/ui";
import type { Column } from "@bicap/ui";
import { getDashboardStats, getAdminFarms, getAdminUsers } from "@/lib/api";
import type { Farm } from "@bicap/types";
import Link from "next/link";

const PENDING_COLS: Column<Farm>[] = [
  { key: "farmName",  header: "Tên trang trại" },
  { key: "province",  header: "Tỉnh/Thành" },
  { key: "totalArea", header: "Diện tích (ha)" },
  { key: "createdAt", header: "Ngày đăng ký",
    render: (v) => new Date(v as string).toLocaleDateString("vi-VN") },
];

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const { data: userCountPage, isLoading: usersCountLoading } = useQuery({
    queryKey: ["admin-users", "count-only"],
    queryFn: () => getAdminUsers({ page: 0, size: 1 }),
  });

  const { data: pendingFarms, isLoading: farmsLoading } = useQuery({
    queryKey: ["admin-farms", "PENDING"],
    queryFn: () => getAdminFarms("PENDING"),
  });

  const L = statsLoading;
  const UL = usersCountLoading;

  return (
    <div className="space-y-6">
      {/* ── Page title ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Tổng quan hệ thống BICAP</p>
      </div>

      {/* ── Stats Row 1: 4 cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Tổng người dùng"
          value={UL ? "—" : (userCountPage?.total ?? 0)}
          icon={<span>👤</span>}
          color="blue"
        />
        <StatCard
          title="Farms đã duyệt"
          value={L ? "—" : (stats?.approvedFarms ?? 0)}
          icon={<span>🌾</span>}
          color="green"
        />
        <StatCard
          title="Nhà bán lẻ"
          value={L ? "—" : (stats?.totalRetailers ?? 0)}
          icon={<span>🏪</span>}
          color="purple"
        />
        <StatCard
          title="Đơn hàng hôm nay"
          value={L ? "—" : (stats?.ordersToday ?? 0)}
          icon={<span>📦</span>}
          color="orange"
        />
      </div>

      {/* ── Stats Row 2 ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          title="Farms chờ duyệt"
          value={farmsLoading ? "—" : (pendingFarms?.total ?? 0)}
          icon={<span>⏳</span>}
          color="rose"
        />
        <StatCard
          title="Doanh thu tháng (VNĐ)"
          value={L ? "—" : (stats?.revenueThisMonth ?? 0).toLocaleString("vi-VN")}
          icon={<span>💰</span>}
          color="teal"
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LineChart: Doanh thu */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <SectionHeader title="Doanh thu 6 tháng" subtitle="Đơn vị: triệu VNĐ" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats?.revenueByMonth ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                formatter={(v) => [`${Number(v ?? 0).toLocaleString()} tr`, "Doanh thu"]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* BarChart: Đơn hàng */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <SectionHeader title="Đơn hàng theo tháng" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.ordersByMonth ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                formatter={(v) => [Number(v ?? 0), "Đơn hàng"]}
              />
              <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Pending Approvals Widget ── */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <SectionHeader
          title={`Farms chờ duyệt${pendingFarms?.total ? ` (${pendingFarms.total})` : ""}`}
          subtitle="Các trang trại đang chờ phê duyệt"
          action={
            <Link
              href="/admin/farms"
              className="text-xs font-semibold text-green-600 hover:text-green-700 transition"
            >
              Xem tất cả →
            </Link>
          }
        />
        <DataTable<Farm>
          columns={PENDING_COLS}
          data={pendingFarms?.data?.slice(0, 5) ?? []}
          isLoading={farmsLoading}
          keyField="id"
          emptyMessage="Không có farm nào chờ duyệt ✓"
        />
      </div>
    </div>
  );
}
