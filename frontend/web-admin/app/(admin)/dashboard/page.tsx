"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { StatCard, DataTable } from "@bicap/ui";
import type { Column } from "@bicap/ui";
import { getDashboardStats, getAdminFarms, approveFarm } from "@/lib/api";
import type { Farm } from "@bicap/types";
import Link from "next/dist/client/link";

// Cột cho bảng farms chờ duyệt
const PENDING_COLS: Column<Farm>[] = [
  { key: "farmName",  header: "Tên trang trại" },
  { key: "province",  header: "Tỉnh/Thành" },
  { key: "totalArea", header: "Diện tích (ha)" },
  { key: "createdAt", header: "Ngày đăng ký",
    render: (v) => new Date(v as string).toLocaleDateString("vi-VN") },
];

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const { data: pendingFarms, isLoading: farmsLoading } = useQuery({
    queryKey: ["admin-farms", "PENDING"],
    queryFn: () => getAdminFarms("PENDING"),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Tổng quan hệ thống BICAP</p>
      </div>

      {/* ── 4 StatCards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Farms đã duyệt"
          value={statsLoading ? "..." : (stats?.approvedFarms ?? 0)}
          icon={<span className="text-2xl">🌾</span>}
        />
        <StatCard
          title="Nhà bán lẻ"
          value={statsLoading ? "..." : (stats?.totalRetailers ?? 0)}
          icon={<span className="text-2xl">🏪</span>}
        />
        <StatCard
          title="Đơn hàng hôm nay"
          value={statsLoading ? "..." : (stats?.ordersToday ?? 0)}
          icon={<span className="text-2xl">📦</span>}
        />
        <StatCard
          title="Doanh thu tháng (VNĐ)"
          value={
            statsLoading
              ? "..."
              : (stats?.revenueThisMonth ?? 0).toLocaleString("vi-VN")
          }
          icon={<span className="text-2xl">💰</span>}
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LineChart: Doanh thu */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-base font-semibold text-gray-800">
            Doanh thu 6 tháng (triệu VNĐ)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats?.revenueByMonth ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v: number) => [`${v.toLocaleString()} tr`, "Doanh thu"]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: "#22c55e", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* BarChart: Đơn hàng */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-base font-semibold text-gray-800">
            Đơn hàng theo tháng
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.ordersByMonth ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [v, "Đơn hàng"]} />
              <Bar dataKey="orders" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Pending Approvals Widget ── */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">
            Farms chờ duyệt ({pendingFarms?.total ?? 0})
          </h2>
          <Link 
            href="/farms" 
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            Xem tất cả →
          </Link>
        </div>
        <DataTable<Farm>
          columns={PENDING_COLS}
          data={pendingFarms?.data?.slice(0, 5) ?? []}
          isLoading={farmsLoading}
          keyField="id"
          emptyMessage="Không có farm nào chờ duyệt"
        />
      </div>
    </div>
  );
}