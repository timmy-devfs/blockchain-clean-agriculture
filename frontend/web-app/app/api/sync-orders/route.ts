// Nhận POST từ shipping dashboard → ghi JSON; GET trả payload (debug / admin fallback).

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSharedOrdersFilePath } from "@/lib/shipping-sync-shared";

export type SyncOrdersStored = {
  orders?: unknown[];
  shipments?: unknown[];
  lastUpdated?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let payload: SyncOrdersStored;

    if (Array.isArray(body)) {
      payload = { orders: body, shipments: [], lastUpdated: new Date().toISOString() };
    } else if (body && typeof body === "object") {
      payload = {
        orders: Array.isArray(body.orders) ? body.orders : [],
        shipments: Array.isArray(body.shipments) ? body.shipments : [],
        lastUpdated:
          typeof body.lastUpdated === "string"
            ? body.lastUpdated
            : new Date().toISOString(),
      };
    } else {
      payload = { orders: [], shipments: [], lastUpdated: new Date().toISOString() };
    }

    const sharedFile = getSharedOrdersFilePath();
    const dir = path.dirname(sharedFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(sharedFile, JSON.stringify(payload, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[sync-orders] Error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sharedFile = getSharedOrdersFilePath();
    if (!fs.existsSync(sharedFile)) {
      return NextResponse.json({ orders: [], shipments: [], lastUpdated: null });
    }
    const raw = fs.readFileSync(sharedFile, "utf-8");
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return NextResponse.json({ orders: parsed, shipments: [], lastUpdated: null });
      }
      if (parsed && typeof parsed === "object") {
        return NextResponse.json(parsed);
      }
      return NextResponse.json({ orders: [], shipments: [], lastUpdated: null });
    } catch {
      return NextResponse.json({ orders: [], shipments: [], lastUpdated: null });
    }
  } catch {
    return NextResponse.json({ orders: [], shipments: [], lastUpdated: null });
  }
}
