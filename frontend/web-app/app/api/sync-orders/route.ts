// Nhận POST từ shipping dashboard → ghi JSON; GET trả raw mảng (debug / tương thích).
// Admin đọc chuẩn qua GET /internal/shipping-sync (map sang payload admin).

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSharedOrdersFilePath } from "@/lib/shipping-sync-shared";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orders = Array.isArray(body) ? body : [];
    const sharedFile = getSharedOrdersFilePath();
    const dir = path.dirname(sharedFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(sharedFile, JSON.stringify(orders, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[sync-orders] Error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sharedFile = getSharedOrdersFilePath();
    if (!fs.existsSync(sharedFile)) return NextResponse.json([]);
    const raw = fs.readFileSync(sharedFile, "utf-8");
    try {
      return NextResponse.json(JSON.parse(raw));
    } catch {
      return NextResponse.json([]);
    }
  } catch {
    return NextResponse.json([]);
  }
}
