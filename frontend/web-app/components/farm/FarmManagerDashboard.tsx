"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bicap/ui";
import { getAxiosErrorMessage, getOwnerFarms, getOwnerSeasons } from "@/lib/api";
import { CreateFarmModal } from "./CreateFarmModal";
import { CreateSeasonModal } from "./CreateSeasonModal";
import { CreateListingModal } from "./CreateListingModal";

export function FarmManagerDashboard() {
  const farmsQ = useQuery({ queryKey: ["owner-farms"], queryFn: getOwnerFarms });
  const seasonsQ = useQuery({
    queryKey: ["owner-seasons"],
    queryFn: () => getOwnerSeasons({ page: 1, limit: 100 }),
  });

  const approvedFarms = useMemo(
    () =>
      (farmsQ.data ?? []).filter(
        (f) => f.status === "APPROVED" || f.isApproved
      ),
    [farmsQ.data]
  );

  const seasonsWithChain = useMemo(
    () =>
      (seasonsQ.data?.items ?? []).filter(
        (s) => s.txHash != null && String(s.txHash).length > 0
      ),
    [seasonsQ.data?.items]
  );

  const [farmOpen, setFarmOpen] = useState(false);
  const [seasonOpen, setSeasonOpen] = useState(false);
  const [listingOpen, setListingOpen] = useState(false);

  const canCreateSeason = approvedFarms.length > 0;
  const canList = seasonsWithChain.length > 0;

  return (
    <div className="min-h-[calc(100vh-2rem)] bg-gradient-to-b from-emerald-50/60 to-white px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Farm Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Tạo trang trại, vụ mùa và đăng sản phẩm — không cần curl.
            </p>
          </div>
          <Link
            href="/farm/legacy"
            className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
          >
            Mở Farm Console đầy đủ (IoT, đơn hàng…) →
          </Link>
        </div>

        {(farmsQ.isError || seasonsQ.isError) && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <p className="font-medium">Không tải được dữ liệu farm / vụ mùa.</p>
            <p className="mt-1 text-xs opacity-90">
              {farmsQ.isError ? getAxiosErrorMessage(farmsQ.error, "Lỗi farms") : ""}
              {farmsQ.isError && seasonsQ.isError ? " · " : ""}
              {seasonsQ.isError ? getAxiosErrorMessage(seasonsQ.error, "Lỗi seasons") : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void farmsQ.refetch()}>
                Thử lại (farm)
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => void seasonsQ.refetch()}>
                Thử lại (vụ mùa)
              </Button>
            </div>
            <p className="mt-2 text-xs text-rose-700">
              Dùng URL <strong>http://localhost:3000</strong> (không dùng 127.0.0.1) để cookie đăng nhập khớp SameSite.
            </p>
          </div>
        )}

        <Card className="border-emerald-100 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>
              Các bước chính trong luồng BICAP
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              className="h-auto min-h-11 flex-1 flex-col gap-0.5 bg-emerald-600 py-3 text-left hover:bg-emerald-700 sm:max-w-[220px]"
              onClick={() => setFarmOpen(true)}
            >
              <span className="text-lg">🌾</span>
              <span className="font-semibold">Tạo Farm mới</span>
              <span className="text-xs font-normal opacity-90">
                Đăng ký trang trại
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!canCreateSeason}
              title={
                !canCreateSeason
                  ? "Cần có ít nhất một farm đã được Admin duyệt"
                  : undefined
              }
              className="h-auto min-h-11 flex-1 flex-col gap-0.5 border-emerald-200 py-3 text-left hover:bg-emerald-50 sm:max-w-[220px]"
              onClick={() => setSeasonOpen(true)}
            >
              <span className="text-lg">🌱</span>
              <span className="font-semibold text-gray-900">Tạo Vụ mùa</span>
              <span className="text-xs font-normal text-gray-500">
                Sau khi farm được duyệt
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!canList}
              title={
                !canList
                  ? "Cần vụ mùa đã có txHash blockchain (Admin đã duyệt ghi chain)"
                  : undefined
              }
              className="h-auto min-h-11 flex-1 flex-col gap-0.5 border-amber-200 py-3 text-left hover:bg-amber-50 sm:max-w-[220px]"
              onClick={() => setListingOpen(true)}
            >
              <span className="text-lg">📢</span>
              <span className="font-semibold text-gray-900">Đăng lên sàn</span>
              <span className="text-xs font-normal text-gray-500">
                Marketplace
              </span>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Farm của bạn
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {farmsQ.isLoading ? "…" : (farmsQ.data?.length ?? 0)}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Đã duyệt: {approvedFarms.length}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Vụ mùa
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {seasonsQ.isLoading ? "…" : (seasonsQ.data?.total ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Đã có txHash
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {seasonsQ.isLoading ? "…" : seasonsWithChain.length}
            </p>
          </div>
        </div>
      </div>

      <CreateFarmModal isOpen={farmOpen} onClose={() => setFarmOpen(false)} />
      <CreateSeasonModal isOpen={seasonOpen} onClose={() => setSeasonOpen(false)} />
      <CreateListingModal isOpen={listingOpen} onClose={() => setListingOpen(false)} />
    </div>
  );
}
