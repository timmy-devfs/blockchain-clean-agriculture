import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy OSRM driving route — tránh CORS / chặn fetch từ browser tới router.project-osrm.org
 * Query: fromLon,fromLat,toLon,toLat (WGS84)
 */
export async function GET(req: NextRequest) {
  const fromLon = req.nextUrl.searchParams.get('fromLon');
  const fromLat = req.nextUrl.searchParams.get('fromLat');
  const toLon = req.nextUrl.searchParams.get('toLon');
  const toLat = req.nextUrl.searchParams.get('toLat');
  if (!fromLon || !fromLat || !toLon || !toLat) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 });
  }

  const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`;

  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: ctrl.signal,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : 502 });
  } catch (e) {
    return NextResponse.json({ code: 'Error', message: String(e) }, { status: 502 });
  } finally {
    clearTimeout(tid);
  }
}
