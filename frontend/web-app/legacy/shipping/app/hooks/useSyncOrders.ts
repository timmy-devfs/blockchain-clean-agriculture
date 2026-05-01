// frontend/web-app/legacy/shipping/app/hooks/useSyncOrders.ts
// Đồng bộ snapshot đơn/lô trên dashboard → route Next.js `POST /api/sync-orders`
// (app/api/sync-orders) để admin có thể đọc fallback — **không** phải shipping-service `/api/shipping/*`.
// Dùng trong dashboard: useSyncOrders(orders)

import { useEffect, useRef } from "react";

export function useSyncOrders(orders: any[]) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Debounce 800ms để tránh gọi API liên tục khi thao tác nhanh
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetch("/api/sync-orders", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orders),
      }).catch(() => {/* silent fail */});
    }, 800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [orders]);
}