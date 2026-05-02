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

    const rows = Array.isArray(parsed) ? (parsed as DashboardSyncedOrder[]) : [];
    if (rows.length === 0) {
      return NextResponse.json({ data: [], source: "sync_empty", error: null });
    }

    const mapped = mapDashboardOrdersToSyncPayload(rows);
    return NextResponse.json({ data: mapped, source: "sync_ok", error: null });
  } catch {
    return NextResponse.json({ data: [], source: "fallback_empty", error: null });
  }
}
