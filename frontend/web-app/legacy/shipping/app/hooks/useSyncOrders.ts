// frontend/web-app/legacy/shipping/app/hooks/useSyncOrders.ts
// Đồng bộ snapshot đơn/lô trên dashboard → route Next.js `POST /api/sync-orders`
// (app/api/sync-orders) để admin có thể đọc fallback — **không** phải shipping-service `/api/shipping/*`.
// Dùng trong dashboard: useSyncOrders(orders)

import { useEffect, useRef } from "react";

/** POST tương đối `/api/sync-orders` (Next.js), không qua gateway. */
export function useSyncOrders(orders: unknown[], onSynced?: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSyncedRef = useRef(onSynced);
  onSyncedRef.current = onSynced;

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetch("/api/sync-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orders),
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
  }, [orders]);
}