// Đồng bộ snapshot đơn/lô + shipments API → route Next.js `POST /api/sync-orders`

import { useEffect, useRef } from "react";

export type SyncOrdersExtras = {
  shipments?: unknown[];
  onSynced?: () => void;
};

/** POST tương đối `/api/sync-orders` (Next.js), không qua gateway. */
export function useSyncOrders(orders: unknown[], extras?: SyncOrdersExtras) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSyncedRef = useRef(extras?.onSynced);
  onSyncedRef.current = extras?.onSynced;

  const ordersJson = JSON.stringify(orders);
  const shipmentsJson = JSON.stringify(extras?.shipments ?? []);

  useEffect(() => {
    const ordersPayload = JSON.parse(ordersJson) as unknown[];
    const shipmentsPayload = JSON.parse(shipmentsJson) as unknown[];

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetch("/api/sync-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orders: ordersPayload,
          shipments: shipmentsPayload,
          lastUpdated: new Date().toISOString(),
        }),
      })
        .then((res) => {
          if (res.ok) onSyncedRef.current?.();
        })
        .catch(() => {
          /* silent */
        });
    }, 800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [ordersJson, shipmentsJson]);
}
