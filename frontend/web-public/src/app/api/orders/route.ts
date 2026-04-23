// frontend/web-public/app/api/orders/route.ts
// Đọc shared/orders.json để tra cứu lô hàng thật

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SHARED_FILE = path.resolve(process.cwd(), '..', 'shared', 'orders.json');

export async function GET() {
  try {
    if (!fs.existsSync(SHARED_FILE)) return NextResponse.json([]);
    const raw = fs.readFileSync(SHARED_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json([]);
  }
}