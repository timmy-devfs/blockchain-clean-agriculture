"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button } from "@bicap/ui";
import {
  getOwnerFarms,
  getOwnerMarketplaceListings,
  getOwnerSeasons,
  type FarmerSeasonRow,
} from "@/lib/api";
import { CreateListingModal } from "./CreateListingModal";
import { SeasonUpdateModal } from "./SeasonUpdateModal";

const VECHAIN_TX = "https://explore.vechain.org/transactions";

function statusBadgeClass(status: string): string {
  switch (status) {
    case "PREPARING":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "HARVESTED":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "EXPORTED":
      return "bg-violet-100 text-violet-800 border-violet-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function FarmSeasonsView() {
  const farmsQ = useQuery({ queryKey: ["owner-farms"], queryFn: getOwnerFarms });
  const seasonsQ = useQuery({
    queryKey: ["owner-seasons"],
    queryFn: () => getOwnerSeasons({ page: 1, limit: 200 }),
  });
  const listingsQ = useQuery({
    queryKey: ["owner-marketplace-listings"],
    queryFn: getOwnerMarketplaceListings,
  });

  const farmNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of farmsQ.data ?? []) m.set(f.id, f.farmName);
    return m;
  }, [farmsQ.data]);

  const listingSeasonIds = useMemo(() => {
    const s = new Set<string>();
    for (const l of listingsQ.data ?? []) s.add(l.seasonId);
    return s;
  }, [listingsQ.data]);

  const [listingSeasonId, setListingSeasonId] = useState<string | undefined>();
  const [listingModalOpen, setListingModalOpen] = useState(false);
  const [updateSeason, setUpdateSeason] = useState<FarmerSeasonRow | null>(null);

  const items = seasonsQ.data?.items ?? [];

  return (
    <div className="min-h-[calc(100vh-2rem)] bg-gradient-to-b from-emerald-50/60 to-white px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vụ mùa</h1>
          <p className="mt-1 text-sm text-gray-600">
            Theo dõi trạng thái, txHash VeChain và đăng bán khi đã ghi chain.
          </p>
        </div>

        {seasonsQ.isLoading ? (
          <p className="text-sm text-gray-500">Đang tải…</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            Chưa có vụ mùa. Tạo từ{" "}
            <a href="/farm/dashboard" className="font-medium text-emerald-700 underline">
              Dashboard
            </a>
            .
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {row.cropType}{" "}
                      <span className="font-normal text-gray-500">
                        · {farmNameById.get(row.farmId) ?? row.farmId}
                      </span>
                    </p>
                    <Badge
                      className={`mt-2 border ${statusBadgeClass(row.status)}`}
                    >
                      {row.status}
                    </Badge>
                    <p className="mt-2 text-xs text-gray-500">
                      Bắt đầu:{" "}
                      {new Date(row.startDate).toLocaleDateString("vi-VN")}
                      {row.estimatedEndDate
                        ? ` → ${new Date(row.estimatedEndDate).toLocaleDateString("vi-VN")}`
                        : ""}
                      {row.totalYield != null && (
                        <>
                          {" "}
                          · Ước tính: <strong>{row.totalYield}</strong>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    {row.txHash ? (
                      <a
                        href={`${VECHAIN_TX}/${row.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
                      >
                        Xem VeChain ↗
                      </a>
                    ) : (
                      <span className="text-sm text-amber-700">
                        Đang xử lý blockchain…
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {row.txHash && !listingSeasonIds.has(row.id) && (
                    <Button
                      type="button"
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600"
                      onClick={() => {
                        setListingSeasonId(row.id);
                        setListingModalOpen(true);
                      }}
                    >
                      Đăng lên sàn
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setUpdateSeason(row)}
                  >
                    Cập nhật tiến trình
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreateListingModal
        isOpen={listingModalOpen}
        onClose={() => {
          setListingModalOpen(false);
          setListingSeasonId(undefined);
        }}
        preselectSeasonId={listingSeasonId}
      />

      {updateSeason && (
        <SeasonUpdateModal
          isOpen={!!updateSeason}
          onClose={() => setUpdateSeason(null)}
          seasonId={updateSeason.id}
          cropLabel={`${updateSeason.cropType} · ${farmNameById.get(updateSeason.farmId) ?? ""}`}
        />
      )}
    </div>
  );
}
