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

  const query = `route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`;
  const providers = [
    `https://router.project-osrm.org/${query}`,
    `https://routing.openstreetmap.de/routed-car/${query}`,
  ];

  for (const url of providers) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 12_000);
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (res.ok && data?.code === 'Ok') {
        return NextResponse.json(data, { status: 200 });
      }
    } catch {
      // thử provider kế tiếp
    } finally {
      clearTimeout(tid);
    }
  }

  return NextResponse.json(
    { code: 'Error', message: 'No routing provider available' },
    { status: 502 }
  );
}
