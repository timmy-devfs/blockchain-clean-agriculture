"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Toast } from "@bicap/ui";
import {
  createMarketplaceListing,
  getAxiosErrorMessage,
  getOwnerFarms,
  getOwnerSeasons,
} from "@/lib/api";

const SELL_UNITS = ["kg", "tấn"] as const;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preselectSeasonId?: string;
}

export function CreateListingModal({
  isOpen,
  onClose,
  preselectSeasonId,
}: Props) {
  const qc = useQueryClient();
  const farmsQ = useQuery({ queryKey: ["owner-farms"], queryFn: getOwnerFarms });
  const seasonsQ = useQuery({
    queryKey: ["owner-seasons"],
    queryFn: () => getOwnerSeasons({ page: 1, limit: 200 }),
  });

  const seasonOptions = useMemo(() => {
    return (seasonsQ.data?.items ?? []).filter(
      (s) => s.status === "PREPARING" || s.status === "ACTIVE" || s.status === "HARVESTED"
    ).filter((s) => s.txHash != null && String(s.txHash).length > 0);
  }, [seasonsQ.data?.items]);

  const farmNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of farmsQ.data ?? []) m.set(f.id, f.farmName);
    return m;
  }, [farmsQ.data]);

  const [seasonId, setSeasonId] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (preselectSeasonId && seasonOptions.some((s) => s.id === preselectSeasonId)) {
      setSeasonId(preselectSeasonId);
    } else if (!preselectSeasonId) {
      setSeasonId("");
    }
  }, [isOpen, preselectSeasonId, seasonOptions]);
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<(typeof SELL_UNITS)[number]>("kg");
  const [description, setDescription] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(
    null
  );

  const selectedSeason = useMemo(
    () => seasonOptions.find((s) => s.id === seasonId),
    [seasonOptions, seasonId]
  );

  const farmIdForSeason = selectedSeason?.farmId ?? "";

  const mut = useMutation({
    mutationFn: async () => {
      const price = Number(unitPrice.replace(/[^\d.]/g, ""));
      const qty = Number(quantity.replace(",", "."));
      const farmId = farmIdForSeason;
      if (!farmId || !seasonId) throw new Error("Chọn vụ mùa");
      const title = `${selectedSeason?.cropType ?? "Sản phẩm"} — ${farmNameById.get(farmId) ?? farmId} (${unit})`;
      const desc =
        [description.trim(), `Đơn vị niêm yết: ${unit}`].filter(Boolean).join("\n") ||
        undefined;
      return createMarketplaceListing({
        farmId,
        seasonId,
        title,
        description: desc,
        quantity: qty,
        unitPrice: price,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["owner-marketplace-listings"] });
      void qc.invalidateQueries({ queryKey: ["owner-seasons"] });
      setToast({ msg: "Sản phẩm đã lên sàn!", type: "success" });
      setSeasonId("");
      setUnitPrice("");
      setQuantity("");
      setDescription("");
      onClose();
    },
    onError: (err) =>
      setToast({
        msg: getAxiosErrorMessage(err, "Không đăng được listing"),
        type: "error",
      }),
  });

  if (!isOpen) return null;

  const priceNum = Number(unitPrice.replace(/[^\d.]/g, ""));
  const qtyNum = Number(quantity.replace(",", "."));
  const maxYield = selectedSeason?.totalYield ?? undefined;
  const overYield =
    maxYield != null &&
    Number.isFinite(qtyNum) &&
    qtyNum > maxYield;

  const valid =
    seasonId &&
    Number.isFinite(priceNum) &&
    priceNum > 0 &&
    Number.isFinite(qtyNum) &&
    qtyNum > 0 &&
    !overYield;

  return (
    <>
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-900">Đăng lên sàn</h2>
          <p className="mt-1 text-sm text-gray-500">
            Chọn vụ mùa đã có txHash blockchain. Giá theo VNĐ / đơn vị.
          </p>

          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Vụ mùa <span className="text-red-500">*</span>
              <select
                value={seasonId}
                onChange={(e) => setSeasonId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">— Chọn —</option>
                {seasonOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {farmNameById.get(s.farmId) ?? s.farmId} · {s.cropType} ·{" "}
                    {s.txHash?.slice(0, 10)}…
                  </option>
                ))}
              </select>
            </label>
            {selectedSeason?.totalYield != null && (
              <p className="text-xs text-gray-500">
                Sản lượng vụ (ước tính):{" "}
                <strong>{selectedSeason.totalYield}</strong> — số lượng bán không vượt quá.
              </p>
            )}
            <label className="block text-sm font-medium text-gray-700">
              Giá / đơn vị (VNĐ) <span className="text-red-500">*</span>
              <input
                type="number"
                min={1}
                step={1}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="VD: 25000"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-gray-700">
                Số lượng bán <span className="text-red-500">*</span>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Đơn vị
                <select
                  value={unit}
                  onChange={(e) =>
                    setUnit(e.target.value as (typeof SELL_UNITS)[number])
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  {SELL_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-sm font-medium text-gray-700">
              Mô tả ngắn
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="Ghi chú chất lượng, vùng trồng…"
              />
            </label>
            {overYield && (
              <p className="text-xs text-red-600">
                Số lượng vượt sản lượng vụ đã khai báo.
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={
                !valid ||
                mut.isPending ||
                seasonOptions.length === 0
              }
              onClick={() => mut.mutate()}
            >
              {mut.isPending ? "Đang đăng…" : "Đăng lên sàn"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
