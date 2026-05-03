import { NextResponse } from "next/server";
import {
  mapDashboardOrdersToSyncPayload,
  type DashboardSyncedOrder,
} from "@/lib/shipping-sync-shared";

/**
 * Admin đọc dữ liệu đã sync từ shipping dashboard.
 * GET /api/sync-orders (route Next.js) rồi map sang payload admin.
 */
export async function GET() {
  const port = process.env.PORT ?? "3000";
  const url = `http://127.0.0.1:${port}/api/sync-orders`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ data: [], source: "fallback_empty", error: null });
    }

    let parsed: unknown;
    try {
      parsed = await res.json();
    } catch {
      return NextResponse.json({ data: [], source: "fallback_empty", error: null });
    }

    const fromOrders: Record<string, unknown>[] = [];
    const fromShipments: Record<string, unknown>[] = [];

    if (Array.isArray(parsed)) {
      fromOrders.push(...mapDashboardOrdersToSyncPayload(parsed as DashboardSyncedOrder[]));
    } else if (parsed && typeof parsed === "object") {
      const o = parsed as { orders?: unknown; shipments?: unknown };
      if (Array.isArray(o.orders) && o.orders.length > 0) {
        fromOrders.push(
          ...mapDashboardOrdersToSyncPayload(o.orders as DashboardSyncedOrder[]),
        );
      }
      if (Array.isArray(o.shipments) && o.shipments.length > 0) {
        for (const row of o.shipments) {
          if (row && typeof row === "object") {
            // Raw shipping-service payload — admin `getAdminShipments` gọi mapShipmentRow một lần
            fromShipments.push(row as Record<string, unknown>);
          }
        }
      }
    }

    const merged: Record<string, unknown>[] = [
      ...(fromShipments as Record<string, unknown>[]),
      ...(fromOrders as Record<string, unknown>[]),
    ];
    if (merged.length === 0) {
      return NextResponse.json({ data: [], source: "sync_empty", error: null });
    }

    return NextResponse.json({ data: merged, source: "sync_ok", error: null });
  } catch {
    return NextResponse.json({ data: [], source: "fallback_empty", error: null });
  }
}
