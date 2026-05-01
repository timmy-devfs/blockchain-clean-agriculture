import fs from "fs";
import { NextResponse } from "next/server";
import {
  getSharedOrdersFilePath,
  mapDashboardOrdersToSyncPayload,
  type DashboardSyncedOrder,
} from "@/lib/shipping-sync-shared";

/**
 * Admin đọc dữ liệu đã sync từ shipping dashboard.
 * Đọc trực tiếp file JSON (cùng path với POST /api/sync-orders) — không HTTP self-fetch
 * tới localhost (tránh sai PORT trong Docker / race với nhiều instance).
 */
export async function GET() {
  const filePath = getSharedOrdersFilePath();
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ data: [], source: filePath, error: null });
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({
        data: [],
        source: filePath,
        error: "invalid_json",
      });
    }

    const rows = Array.isArray(parsed) ? (parsed as DashboardSyncedOrder[]) : [];
    const mapped = mapDashboardOrdersToSyncPayload(rows);

    return NextResponse.json({ data: mapped, source: filePath, error: null });
  } catch (error) {
    return NextResponse.json(
      {
        data: [],
        source: filePath,
        error: error instanceof Error ? error.message : "read_failed",
      },
      { status: 200 },
    );
  }
}
