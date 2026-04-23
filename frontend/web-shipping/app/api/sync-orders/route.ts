// frontend/web-shipping/app/api/sync-orders/route.ts
// Nhận POST từ dashboard → ghi ra shared/orders.json

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Đường dẫn tới file shared — relative từ root project
const SHARED_FILE = path.resolve(process.cwd(), '..', 'shared', 'orders.json');

export async function POST(req: NextRequest) {
  try {
    const orders = await req.json();

    // Tạo thư mục nếu chưa có
    const dir = path.dirname(SHARED_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(SHARED_FILE, JSON.stringify(orders, null, 2), 'utf-8');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[sync-orders] Error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!fs.existsSync(SHARED_FILE)) return NextResponse.json([]);
    const raw = fs.readFileSync(SHARED_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json([]);
  }
}