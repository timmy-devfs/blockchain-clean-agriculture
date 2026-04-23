// frontend/web-shipping/app/hooks/useSyncOrders.ts
// Tự động sync orders lên shared/orders.json qua API route
// Dùng trong dashboard: useSyncOrders(orders)

import { useEffect, useRef } from 'react';

export function useSyncOrders(orders: any[]) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Debounce 800ms để tránh gọi API liên tục khi thao tác nhanh
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetch('/api/sync-orders', {
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