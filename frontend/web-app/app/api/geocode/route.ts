import { NextRequest, NextResponse } from "next/server";

/** Geocoding phía server — tránh CORS browser + User-Agent hợp lệ cho Nominatim */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ lat: null, lon: null }, { status: 400 });

  const query = encodeURIComponent(`${q}, Việt Nam`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5&countrycodes=vn`;

  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "vi",
        "User-Agent": "AgriChain-Shipping/1.0 (+https://github.com/blockchain-clean-agriculture)",
      },
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (!res.ok) return NextResponse.json({ lat: null, lon: null });

    const data = (await res.json()) as { lat: string; lon: string }[];
    for (const row of data) {
      const lat = parseFloat(row.lat);
      const lon = parseFloat(row.lon);
      if (lat >= 8.0 && lat <= 24.0 && lon >= 102.0 && lon <= 110.0) {
        return NextResponse.json({ lat, lon });
      }
    }
    return NextResponse.json({ lat: null, lon: null });
  } catch {
    return NextResponse.json({ lat: null, lon: null });
  } finally {
    clearTimeout(tid);
  }
}
