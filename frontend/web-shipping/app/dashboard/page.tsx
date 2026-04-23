'use client';

import { useState, useEffect, useCallback, useRef, CSSProperties } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useSyncOrders } from '../hooks/useSyncOrders';
import { resolveProvinceCoords } from '../../lib/vn-province-coords';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Order {
  id: string; cargo: string; weight: string; qty: string; farm: string;
  from: string; to: string; date: string; time: string; driver: string;
  status: string; note: string; createdAt: string;
  timeline: { time: string; label: string; desc: string }[];
}
interface Driver { name: string; phone: string; plate: string; vehicle: string; }
type Page = 'dashboard' | 'orders' | 'drivers' | 'new-order' | 'trace' | 'map';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function genId(orders: Order[]) {
  return 'LH' + String(orders.length + 1).padStart(4, '0') + '-' + Date.now().toString(36).toUpperCase().slice(-4);
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  'Chờ xử lý':       { bg: '#fef9c3', color: '#854d0e' },
  'Đang vận chuyển': { bg: '#dbeafe', color: '#1d4ed8' },
  'Đã giao':          { bg: '#dcfce7', color: '#15803d' },
  'Hủy':              { bg: '#fee2e2', color: '#dc2626' },
};
const STATUS_DOT: Record<string, string> = {
  'Chờ xử lý': '#f59e0b', 'Đang vận chuyển': '#3b82f6', 'Đã giao': '#10b981', 'Hủy': '#ef4444',
};

// ─── Shared style tokens ──────────────────────────────────────────────────────
const S: Record<string, CSSProperties> = {
  body:     { display: 'flex', minHeight: '100vh', background: '#f5f7fa', fontFamily: "'Segoe UI', sans-serif", color: '#1a1a2e' },
  sidebar:  { position: 'fixed', top: 0, left: 0, width: 215, height: '100vh', background: '#fff', borderRight: '1px solid #e8eaf0', display: 'flex', flexDirection: 'column', zIndex: 100 },
  logo:     { display: 'flex', alignItems: 'center', gap: 10, padding: '18px 16px', borderBottom: '1px solid #e8eaf0' },
  logoIcon: { width: 36, height: 36, borderRadius: 8, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
  main:     { marginLeft: 215, flex: 1, minHeight: '100vh', position: 'relative', overflow: 'hidden' },
  card:     { background: '#fff', borderRadius: 12, border: '1px solid #e8eaf0', overflow: 'hidden' },
  statCard: { background: '#fff', borderRadius: 12, border: '1px solid #e8eaf0', padding: '20px 22px', flex: 1 },
  inp:      { width: '100%', padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' } as CSSProperties,
  btn:      { padding: '9px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  th:       { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: '#888', background: '#fafafa', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' } as CSSProperties,
  td:       { padding: '11px 14px', fontSize: 13, color: '#444', borderBottom: '1px solid #f5f5f5' },
  label:    { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 },
  overlay:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal:    { background: '#fff', borderRadius: 16, padding: 28, width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.18)' },
};

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @keyframes fadeSlideIn {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes scanLine {
    0%   { top: 6px; }
    100% { top: calc(100% - 6px); }
  }
  @keyframes spinRing {
    from { transform:rotate(0deg); }
    to   { transform:rotate(360deg); }
  }
  @keyframes pulseRing {
    0%   { transform:scale(1);   opacity:.7; }
    100% { transform:scale(1.6); opacity:0; }
  }
  @keyframes shimmerGreen {
    0%   { background-position:-200% center; }
    100% { background-position: 200% center; }
  }

  .page-enter { animation: fadeSlideIn 0.25s cubic-bezier(.22,1,.36,1) forwards; }

  .nav-btn {
    width:100%; display:flex; align-items:center; gap:10px;
    padding:9px 10px; border-radius:8px; font-size:13.5px;
    border:none; cursor:pointer; margin-bottom:2px; text-align:left;
    transition: background 0.15s, color 0.15s, box-shadow 0.15s;
    font-family: inherit;
  }
  .nav-btn:active { transform:scale(.97); }

  .stat-card { transition: box-shadow 0.2s, transform 0.2s; cursor: default; }
  .stat-card:hover { box-shadow: 0 6px 24px rgba(22,163,74,.13); transform:translateY(-2px); }

  .trow { transition: background 0.1s; cursor:pointer; }
  .trow:hover { background: #f0fdf4 !important; }

  .btn-press { transition: transform 0.1s, box-shadow 0.1s; }
  .btn-press:hover  { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,.12); }
  .btn-press:active { transform:scale(.96); }

  .qr-scan { position:absolute; left:4px; right:4px; height:2px;
    background:linear-gradient(90deg,transparent,#16a34a,transparent);
    animation: scanLine 1.5s ease-in-out infinite alternate; border-radius:2px; }

  .dot-pulse::after {
    content:''; position:absolute; inset:-4px; border-radius:50%;
    border:2px solid #16a34a;
    animation: pulseRing 1.6s ease-out infinite;
  }

  .shimmer {
    background: linear-gradient(90deg,#15803d,#4ade80,#15803d);
    background-size:200% auto;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    background-clip:text;
    animation: shimmerGreen 2.8s linear infinite;
  }

  .trace-inp {
    width:100%; padding:13px 16px; border:2px solid #e5e7eb; border-radius:12px;
    font-size:14px; font-family:inherit; outline:none;
    transition: border-color 0.2s, box-shadow 0.2s; background:#fff;
  }
  .trace-inp:focus { border-color:#16a34a; box-shadow:0 0 0 4px rgba(22,163,74,.1); }
  .trace-inp::placeholder { color:#9ca3af; }

  @keyframes toastIn {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .toast {
    position:fixed; bottom:24px; right:24px; z-index:9999;
    background:#111; color:#fff; padding:10px 18px; border-radius:8px;
    font-size:13px; font-weight:500;
    animation: toastIn 0.2s ease both;
  }

  /* Leaflet overrides */
  .leaflet-container { font-family: 'Segoe UI', sans-serif !important; }
  .map-driver-popup .leaflet-popup-content-wrapper {
    border-radius: 12px !important;
    box-shadow: 0 8px 32px rgba(0,0,0,.18) !important;
    padding: 0 !important;
  }
  .map-driver-popup .leaflet-popup-content { margin: 0 !important; }
  .map-driver-popup .leaflet-popup-tip { background: #fff !important; }
`;

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLOR[status] ?? { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{ background: c.bg, color: c.color, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_DOT[status] ?? '#9ca3af', display: 'inline-block' }} />
      {status}
    </span>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>{label}</label>
      <input style={S.inp as React.CSSProperties} type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function QRFrame({ size = 72 }: { size?: number }) {
  const b = 3, r = 14;
  const corners: CSSProperties[] = [
    { top: 0, left: 0, borderTop: `${b}px solid #16a34a`, borderLeft: `${b}px solid #16a34a` },
    { top: 0, right: 0, borderTop: `${b}px solid #16a34a`, borderRight: `${b}px solid #16a34a` },
    { bottom: 0, left: 0, borderBottom: `${b}px solid #16a34a`, borderLeft: `${b}px solid #16a34a` },
    { bottom: 0, right: 0, borderBottom: `${b}px solid #16a34a`, borderRight: `${b}px solid #16a34a` },
  ];
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {corners.map((c, i) => <div key={i} style={{ position: 'absolute', width: r, height: r, borderRadius: 2, ...c }} />)}
      <div className="qr-scan" />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, opacity: .18 }}>▦</div>
    </div>
  );
}

function TLItem({ ev, isFirst, isLast }: { ev: Order['timeline'][0]; isFirst: boolean; isLast: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 14, paddingBottom: isLast ? 0 : 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div className={isFirst ? 'dot-pulse' : ''} style={{
          position: 'relative', width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
          background: isFirst ? '#16a34a' : '#d1fae5',
          border: `2px solid ${isFirst ? '#16a34a' : '#86efac'}`,
        }} />
        {!isLast && <div style={{ width: 2, flex: 1, background: '#e5e7eb', marginTop: 5 }} />}
      </div>
      <div style={{ paddingBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: isFirst ? '#065f46' : '#374151', marginBottom: 2 }}>{ev.label}</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 3 }}>{ev.desc}</div>
        <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>🕐 {ev.time}</div>
      </div>
    </div>
  );
}

// ─── Danh sách 63 tỉnh/thành Việt Nam ────────────────────────────────────────
const VN_PROVINCES = [
  'An Giang','Bà Rịa - Vũng Tàu','Bạc Liêu','Bắc Giang','Bắc Kạn','Bắc Ninh',
  'Bến Tre','Bình Dương','Bình Định','Bình Phước','Bình Thuận','Cà Mau',
  'Cao Bằng','Cần Thơ','Đà Nẵng','Đắk Lắk','Đắk Nông','Điện Biên',
  'Đồng Nai','Đồng Tháp','Gia Lai','Hà Giang','Hà Nam','Hà Nội','Hà Tĩnh',
  'Hải Dương','Hải Phòng','Hậu Giang','Hòa Bình','Hưng Yên','Khánh Hòa',
  'Kiên Giang','Kon Tum','Lai Châu','Lạng Sơn','Lào Cai','Lâm Đồng',
  'Long An','Nam Định','Nghệ An','Ninh Bình','Ninh Thuận','Phú Thọ',
  'Phú Yên','Quảng Bình','Quảng Nam','Quảng Ngãi','Quảng Ninh','Quảng Trị',
  'Sóc Trăng','Sơn La','Tây Ninh','Thái Bình','Thái Nguyên','Thanh Hóa',
  'Thừa Thiên Huế','Tiền Giang','TP. Hồ Chí Minh','Trà Vinh','Tuyên Quang',
  'Vĩnh Long','Vĩnh Phúc','Yên Bái',
];

function ProvinceInput({ label, value, onChange, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  // Sync khi value thay đổi từ ngoài (vd: xóa form)
  useEffect(() => { setQuery(value); }, [value]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const suggestions = query.trim().length === 0
    ? VN_PROVINCES
    : VN_PROVINCES.filter(p =>
        p.toLowerCase().includes(query.toLowerCase()) ||
        p.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
          .includes(query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase())
      );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>{label}</label>
      <input
        style={{ width: '100%', padding: '9px 12px', border: `1px solid ${open ? '#16a34a' : '#e0e0e0'}`,
          borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit',
          boxSizing: 'border-box' as const, background: '#fff',
          boxShadow: open ? '0 0 0 3px rgba(22,163,74,.1)' : 'none', transition: 'all .15s' }}
        placeholder={placeholder}
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
          background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,.12)', marginTop: 4,
          maxHeight: 220, overflowY: 'auto',
        }}>
          {suggestions.map(p => (
            <div key={p}
              onMouseDown={e => { e.preventDefault(); setQuery(p); onChange(p); setOpen(false); }}
              style={{
                padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                background: p === value ? '#f0fdf4' : 'transparent',
                color: p === value ? '#16a34a' : '#333',
                fontWeight: p === value ? 600 : 400,
                borderBottom: '1px solid #f5f5f5',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
              onMouseLeave={e => (e.currentTarget.style.background = p === value ? '#f0fdf4' : 'transparent')}
            >
              📍 {p}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



// Cache geocoding / tuyến đường
const geocodeCache: Record<string, [number, number]> = {};
const routeCache: Record<string, [number, number][]> = {};

/** Khoảng cách km (đại cương) giữa hai điểm [lat, lon] */
function geoDistKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Điểm trên polyline theo tỷ lệ quãng đường t ∈ [0,1] — dùng đặt icon xe trên lộ trình thật */
function pointAlongPolyline(coords: [number, number][], t: number): [number, number] {
  if (coords.length === 0) return [16.2, 107.4];
  if (coords.length === 1) return coords[0];
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const d = geoDistKm(coords[i - 1], coords[i]);
    segs.push(d);
    total += d;
  }
  if (total < 1e-6) return coords[Math.floor(coords.length / 2)];
  let target = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i]) {
      const frac = segs[i] < 1e-9 ? 0 : target / segs[i];
      return [
        coords[i][0] + frac * (coords[i + 1][0] - coords[i][0]),
        coords[i][1] + frac * (coords[i + 1][1] - coords[i][1]),
      ];
    }
    target -= segs[i];
  }
  return coords[coords.length - 1];
}

async function fetchJsonTimeout(url: string, timeoutMs: number): Promise<unknown> {
  const ctrl = new AbortController();
  const tid = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const text = await res.text();
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return {};
    }
  } catch {
    return {};
  } finally {
    window.clearTimeout(tid);
  }
}

async function geocodeAddress(address: string): Promise<[number, number] | null> {
  const key = address.trim();
  if (!key) return null;
  if (geocodeCache[key]) return geocodeCache[key];

  // Bước 1: tra bảng tỉnh/thành ngay — không cần mạng
  const local = resolveProvinceCoords(key);
  if (local) {
    geocodeCache[key] = local;
    return local;
  }

  // Bước 2: gọi Nominatim qua proxy server
  try {
    const data = (await fetchJsonTimeout(`/api/geocode?q=${encodeURIComponent(key)}`, 12_000)) as {
      lat: number | null;
      lon: number | null;
    };
    if (typeof data.lat === 'number' && typeof data.lon === 'number') {
      const coord: [number, number] = [data.lat, data.lon];
      geocodeCache[key] = coord;
      return coord;
    }
  } catch {}

  console.warn('[map] Không tìm được tọa độ cho:', key);
  return null;
}

async function getRoute(from: [number, number], to: [number, number]): Promise<[number, number][]> {
  const key = `${from[0]},${from[1]}-${to[0]},${to[1]}`;
  if (routeCache[key]) return routeCache[key];
  try {
    const params = new URLSearchParams({
      fromLon: String(from[1]),
      fromLat: String(from[0]),
      toLon: String(to[1]),
      toLat: String(to[0]),
    });
    const data = (await fetchJsonTimeout(`/api/osrm?${params}`, 14_000)) as {
      code?: string;
      routes?: { geometry: { coordinates: [number, number][] } }[];
    };
    if (data.code === 'Ok' && data.routes?.[0]) {
      const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]]
      );
      routeCache[key] = coords;
      return coords;
    }
  } catch {}
  return [from, to];
}
const ROUTE_COLORS = ['#16a34a', '#2563eb', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#ea580c'];

function MapPage({ drivers, orders }: { drivers: Driver[]; orders: Order[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  // Lưu layers theo từng order id để có thể highlight/remove riêng lẻ
  const orderLayersRef = useRef<Record<string, any[]>>({});
  // Ref để tránh stale closure trong script.onload
  const ordersRef = useRef<Order[]>(orders);
  useEffect(() => { ordersRef.current = orders; }, [orders]);

  // Tất cả lô hàng "Đang vận chuyển" — hiện hết lên map
  const activeOrders = orders.filter(o => o.status === 'Đang vận chuyển');
  // Tất cả lô hàng "Đã giao" — hiện icon xe tại điểm đến
  const deliveredOrders = orders.filter(o => o.status === 'Đã giao');

  const stats = {
    total:   drivers.length,
    onRoute: drivers.filter(d => orders.some(o => o.driver === d.name && o.status === 'Đang vận chuyển')).length,
    idle:    drivers.filter(d => !orders.some(o => o.driver === d.name && o.status === 'Đang vận chuyển')).length,
    orders:  activeOrders.length,
  };

  // Xóa layers của 1 order cụ thể
  function clearOrderLayers(orderId: string) {
    const layers = orderLayersRef.current[orderId] || [];
    layers.forEach(l => {
      try { mapInstanceRef.current?.removeLayer(l); } catch {}
    });
    delete orderLayersRef.current[orderId];
  }

  // Xóa toàn bộ layers
  function clearAllLayers() {
    Object.keys(orderLayersRef.current).forEach(id => clearOrderLayers(id));
  }

  // Vẽ lại toàn bộ lô lên map (mỗi lần gọi: xóa cũ → vẽ mới — tránh trùng layer / race)
  async function drawAllOrders(allOrders: Order[]) {
    const L = (window as any).L;
    let map = mapInstanceRef.current;
    if (!L || !map) {
      setGeocoding(false);
      return;
    }

    setGeocoding(true);
    try {
      clearAllLayers();

      if (allOrders.length === 0) {
        map = mapInstanceRef.current;
        if (map) map.setView([16.2, 107.4], 6);
        return;
      }

      const allCoords: [number, number][] = [];

      for (let i = 0; i < allOrders.length; i++) {
        map = mapInstanceRef.current;
        if (!map || !L) break;

        const order = allOrders[i];
        const color = ROUTE_COLORS[i % ROUTE_COLORS.length];
        const isDelivered = order.status === 'Đã giao';

        const layers: any[] = [];
        const fromCoord = await geocodeAddress(order.from);
        const toCoord = await geocodeAddress(order.to);

        // Fallback: dùng điểm giữa Việt Nam nếu không tìm được (để vẫn vẽ, không bỏ qua)
        const FC: [number, number] = fromCoord ?? [16.5, 107.0];
        const TC: [number, number] = toCoord ?? [16.5, 108.0];
        const validFrom = !!fromCoord;
        const validTo = !!toCoord;
        if (!validFrom) {
          console.warn('[map] fallback tọa độ cho:', order.from);
        }
        if (!validTo) {
          console.warn('[map] fallback tọa độ cho:', order.to);
        }

        if (validFrom) allCoords.push(FC);
        if (validTo) allCoords.push(TC);

        const routeCoords = await getRoute(FC, TC);

        try {
          const routeLine = L.polyline(routeCoords, {
            color: isDelivered ? '#9ca3af' : color,
            weight: isDelivered ? 2 : 3,
            opacity: isDelivered ? 0.45 : 0.82,
            dashArray: isDelivered ? '4, 8' : undefined,
          }).addTo(map);
          layers.push(routeLine);

          const fromIcon = L.divIcon({
            className: '',
            html: `<div style="background:${isDelivered ? '#9ca3af' : color};color:#fff;padding:4px 8px;border-radius:7px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.2);">📍 ${order.from}</div>`,
            iconAnchor: [0, 10],
          });
          layers.push(L.marker(FC, { icon: fromIcon }).addTo(map));

          const toIcon = L.divIcon({
            className: '',
            html: `<div style="background:#dc2626;color:#fff;padding:4px 8px;border-radius:7px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.2);">🏁 ${order.to}</div>`,
            iconAnchor: [0, 10],
          });
          layers.push(L.marker(TC, { icon: toIcon }).addTo(map));

          const truckPos: [number, number] = isDelivered
            ? TC
            : pointAlongPolyline(routeCoords, 0.46);

          const truckIcon = L.divIcon({
            className: '',
            html: `<div style="
          width:36px;height:36px;
          background:${isDelivered ? '#10b981' : color};
          border-radius:50%;border:3px solid #fff;
          box-shadow:0 3px 10px rgba(0,0,0,0.28);
          display:flex;align-items:center;justify-content:center;
          font-size:17px;
        ">🚚</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

          const popupContent = `
        <div style="padding:10px 13px;min-width:170px;">
          <div style="font-weight:700;font-size:12px;color:${color};margin-bottom:4px;">${order.id}</div>
          <div style="font-weight:600;font-size:12px;color:#111;margin-bottom:5px;">🚚 ${order.driver || 'Chưa phân công'}</div>
          <div style="font-size:11px;color:${isDelivered ? '#10b981' : '#3b82f6'};font-weight:600;margin-bottom:6px;">
            ${isDelivered ? '✅ Đã giao' : '● Đang vận chuyển'}
          </div>
          <div style="font-size:11px;color:#555;margin-bottom:2px;"><b>Hàng:</b> ${order.cargo}</div>
          <div style="font-size:11px;color:#555;"><b>Tuyến:</b> ${order.from} → ${order.to}</div>
        </div>
      `;

          const truckMarker = L.marker(truckPos, { icon: truckIcon, zIndexOffset: 1000 })
            .addTo(map)
            .bindPopup(popupContent, { className: 'map-driver-popup', maxWidth: 220 });
          layers.push(truckMarker);

          orderLayersRef.current[order.id] = layers;
        } catch (layerErr) {
          console.warn('[map] layer error', order.id, layerErr);
        }
        await new Promise(r => setTimeout(r, 80));
      }

      map = mapInstanceRef.current;
      if (map && allCoords.length > 0) {
        try {
          const bounds = L.latLngBounds(allCoords.map(c => L.latLng(c[0], c[1])));
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [48, 48], animate: true, maxZoom: 11 });
          }
        } catch (e) {
          console.warn('fitBounds error:', e);
        }
      } else if (map) {
        try {
          map.setView([16.2, 107.4], 6);
        } catch {}
      }
    } catch (e) {
      console.warn('[map] drawAllOrders', e);
    } finally {
      setGeocoding(false);
    }
  }

  // Focus vào 1 lô hàng cụ thể khi click
  async function focusOrder(order: Order) {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!map || !L) return;
    const fromCoord = await geocodeAddress(order.from);
    const toCoord   = await geocodeAddress(order.to);
    if (fromCoord && toCoord) {
      try {
        const bounds = L.latLngBounds([L.latLng(fromCoord[0], fromCoord[1]), L.latLng(toCoord[0], toCoord[1])]);
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [80, 80], animate: true });
      } catch (e) { console.warn(e); }
    }
  }

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = (window as any).L;
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: true })
        .setView([16.5, 107.5], 6);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
      // Vẽ lô hàng do useEffect([orders, mapReady]) đảm nhiệm — tránh gọi draw 2 lần (race / layer trùng)
    };
    document.head.appendChild(script);

    return () => {
      clearAllLayers();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Khi orders / map sẵn sàng: vẽ lại (debounce nhẹ để tránh hai lần render liên tiếp)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const toShow = [...orders.filter(o => o.status === 'Đang vận chuyển'), ...orders.filter(o => o.status === 'Đã giao')];
    const t = window.setTimeout(() => {
      void drawAllOrders(toShow);
    }, 280);
    return () => window.clearTimeout(t);
  }, [orders, mapReady]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Bản đồ Vận chuyển</div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 3 }}>Theo dõi lộ trình lô hàng · OpenStreetMap + Nominatim</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Tài xế tổng',  value: stats.total,   color: '#111',    bg: '#f9fafb' },
            { label: 'Đang giao',    value: stats.onRoute, color: '#1d4ed8', bg: '#dbeafe' },
            { label: 'Rảnh',         value: stats.idle,    color: '#6b7280', bg: '#f3f4f6' },
            { label: 'Lô đang chạy', value: stats.orders,  color: '#15803d', bg: '#dcfce7' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 70 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Map + Panel */}
      <div style={{ display: 'flex', gap: 14 }}>

        {/* Order list panel */}
        <div style={{ width: 250, flexShrink: 0, background: '#fff', borderRadius: 12, border: '1px solid #e8eaf0', overflowY: 'auto', maxHeight: 580, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f0f0', fontSize: 13, fontWeight: 700, color: '#111', flexShrink: 0 }}>
            📦 Lô hàng vận chuyển
          </div>

          {activeOrders.length === 0 && deliveredOrders.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: '#ccc' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
              <div style={{ fontSize: 12 }}>Chưa có lô hàng nào.<br />Tạo lô hàng và gán trạng thái <b>"Đang vận chuyển"</b>.</div>
            </div>
          ) : (
            <>
              {activeOrders.length > 0 && (
                <div style={{ padding: '6px 14px', fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '.5px', background: '#eff6ff' }}>
                  🔵 Đang vận chuyển ({activeOrders.length})
                </div>
              )}
              {activeOrders.map((o, i) => {
                const isSelected = selectedOrder === o.id;
                const color = ROUTE_COLORS[orders.filter(x => x.status === 'Đang vận chuyển').indexOf(o) % ROUTE_COLORS.length];
                return (
                  <div key={o.id}
                    onClick={() => { setSelectedOrder(o.id); focusOrder(o); }}
                    style={{
                      padding: '10px 14px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer',
                      background: isSelected ? '#f0fdf4' : 'transparent',
                      borderLeft: `3px solid ${isSelected ? color : 'transparent'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <b style={{ fontFamily: 'monospace', fontSize: 11, color: '#16a34a' }}>{o.id}</b>
                    </div>
                    <div style={{ fontSize: 12, color: '#555', marginBottom: 3 }}>📦 {o.cargo}</div>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 1 }}>📍 {o.from}</div>
                    <div style={{ fontSize: 11, color: '#dc2626' }}>🏁 {o.to}</div>
                    {o.driver && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>🚚 {o.driver}</div>}
                  </div>
                );
              })}

              {deliveredOrders.length > 0 && (
                <div style={{ padding: '6px 14px', fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '.5px', background: '#f0fdf4' }}>
                  ✅ Đã giao ({deliveredOrders.length})
                </div>
              )}
              {deliveredOrders.map(o => {
                const isSelected = selectedOrder === o.id;
                return (
                  <div key={o.id}
                    onClick={() => { setSelectedOrder(o.id); focusOrder(o); }}
                    style={{
                      padding: '10px 14px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer',
                      background: isSelected ? '#f0fdf4' : 'transparent',
                      borderLeft: `3px solid ${isSelected ? '#10b981' : 'transparent'}`,
                      opacity: 0.75, transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                      <b style={{ fontFamily: 'monospace', fontSize: 11, color: '#10b981' }}>{o.id}</b>
                    </div>
                    <div style={{ fontSize: 12, color: '#555', marginBottom: 3 }}>📦 {o.cargo}</div>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 1 }}>📍 {o.from}</div>
                    <div style={{ fontSize: 11, color: '#dc2626' }}>🏁 {o.to}</div>
                  </div>
                );
              })}
            </>
          )}

          {/* Hint */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid #f0f0f0', fontSize: 11, color: '#bbb', flexShrink: 0 }}>
            💡 Click vào lô hàng để zoom tới vị trí
          </div>
        </div>

        {/* Map container */}
        <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', border: '1px solid #e8eaf0', position: 'relative', minHeight: 500 }}>
          {!mapReady && (
            <div style={{ position: 'absolute', inset: 0, background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spinRing .7s linear infinite' }} />
              <div style={{ fontSize: 13, color: '#9ca3af' }}>Đang tải bản đồ...</div>
            </div>
          )}
          {geocoding && (
            <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: '#fff', border: '1px solid #fde68a', borderRadius: 8, padding: '7px 14px', fontSize: 12, color: '#92400e', fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,.1)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 14, height: 14, border: '2px solid #fbbf24', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spinRing .7s linear infinite' }} />
              Đang tìm tọa độ địa chỉ...
            </div>
          )}
          <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 500 }} />

          {/* Legend */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 1000, background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '10px 14px', border: '1px solid #e8eaf0', boxShadow: '0 2px 8px rgba(0,0,0,.08)', fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#111', marginBottom: 6 }}>Chú thích</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <div style={{ width: 24, height: 3, background: '#16a34a', borderRadius: 2 }} />
              <span style={{ color: '#555' }}>Lộ trình vận chuyển</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <span style={{ fontSize: 14 }}>📍</span>
              <span style={{ color: '#555' }}>Điểm xuất phát</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <span style={{ fontSize: 14 }}>🏁</span>
              <span style={{ color: '#555' }}>Điểm đến</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <span style={{ fontSize: 14 }}>🚚</span>
              <span style={{ color: '#555' }}>Xe đang giao (giữa tuyến)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 14 }}>🚚</span>
              <span style={{ color: '#10b981' }}>Xe đã giao (tại điểm đến)</span>
            </div>
          </div>

          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, background: 'rgba(255,255,255,0.92)', borderRadius: 8, padding: '6px 10px', border: '1px solid #e8eaf0', fontSize: 11, color: '#888' }}>
            🗺 OpenStreetMap · Nominatim
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ShippingDashboard() {
  const [page, setPage]       = useState<Page>('dashboard');
  const [animKey, setAnimKey] = useState(0);
  const [orders, setOrders]   = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch]   = useState('');
  const [filterS, setFilterS] = useState('');
  const [detail, setDetail]   = useState<Order | null>(null);
  const [showDrv, setShowDrv] = useState(false);
  const [dateStr, setDateStr] = useState('');
  const [navHover, setNavHover] = useState('');
  const [editDriver, setEditDriver] = useState<{ idx: number; data: Driver } | null>(null);
  const [toast, setToast]     = useState('');

  // Sync orders → shared/orders.json để web-public đọc
  useSyncOrders(orders);

  const [traceQ, setTraceQ]         = useState('');
  const [traceResult, setTraceResult] = useState<Order | 'not-found' | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const traceInputRef = useRef<HTMLInputElement>(null);

  const emptyForm = { cargo: '', weight: '', qty: '', farm: '', from: '', to: '', date: '', time: '', driver: '', status: 'Chờ xử lý', note: '' };
  const [form, setForm]       = useState(emptyForm);
  const [drvForm, setDrvForm] = useState({ name: '', phone: '', plate: '', vehicle: '' });

  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, []);

  useEffect(() => {
    const o = localStorage.getItem('agri_orders');
    const d = localStorage.getItem('agri_drivers');
    if (o) setOrders(JSON.parse(o));
    if (d) setDrivers(JSON.parse(d));
    setDateStr(new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  useEffect(() => {
    if (page === 'trace') setTimeout(() => traceInputRef.current?.focus(), 200);
  }, [page]);

  const navigate = useCallback((p: Page) => {
    if (p === page) return;
    setPage(p); setAnimKey(k => k + 1);
    if (p !== 'trace') { setTraceQ(''); setTraceResult(null); }
  }, [page]);

  function saveO(next: Order[]) { setOrders(next); localStorage.setItem('agri_orders', JSON.stringify(next)); }
  function saveD(next: Driver[]) { setDrivers(next); localStorage.setItem('agri_drivers', JSON.stringify(next)); }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }

  function doTrace(q = traceQ) {
    if (!q.trim()) return;
    setTraceLoading(true); setTraceResult(null);
    setTimeout(() => {
      const found = orders.find(o => o.id.toUpperCase().includes(q.trim().toUpperCase()));
      setTraceResult(found ?? 'not-found');
      setTraceLoading(false);
    }, 500);
  }

  function traceOrder(id: string) {
    setTraceQ(id); setTraceResult(null);
    navigate('trace');
    setTimeout(() => {
      const found = orders.find(o => o.id === id);
      setTraceResult(found ?? 'not-found');
    }, 350);
  }

  function copyId(id: string) {
    navigator.clipboard.writeText(id).then(() => showToast('✅ Đã copy mã ' + id));
  }

  const stats = {
    total:   orders.length,
    transit: orders.filter(o => o.status === 'Đang vận chuyển').length,
    wait:    orders.filter(o => o.status === 'Chờ xử lý').length,
    done:    orders.filter(o => o.status === 'Đã giao').length,
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (o.id + o.cargo + o.driver + o.from + o.to).toLowerCase().includes(q) && (!filterS || o.status === filterS);
  }).slice().reverse();

  function changeStatus(id: string, val: string) {
    const next = orders.map(o => o.id === id
      ? { ...o, status: val, timeline: [...(o.timeline || []), { time: new Date().toLocaleString('vi-VN'), label: val, desc: 'Cập nhật trạng thái' }] }
      : o);
    saveO(next);
    if (detail?.id === id) setDetail(next.find(o => o.id === id) ?? null);
  }

  function submitOrder() {
    if (!form.cargo || !form.from || !form.to) { alert('Vui lòng điền: Hàng hóa, Điểm đi, Điểm đến.'); return; }
    const order: Order = {
      ...form, id: genId(orders), createdAt: new Date().toLocaleDateString('vi-VN'),
      timeline: [{ time: new Date().toLocaleString('vi-VN'), label: 'Đã tạo lô hàng', desc: 'Lô hàng vừa được tạo' }],
    };
    saveO([...orders, order]);
    setForm(emptyForm);
    showToast('✅ Tạo thành công! Mã: ' + order.id);
    navigate('orders');
  }

  function deleteOrder(id: string) {
    if (!confirm('Xóa lô hàng này?')) return;
    saveO(orders.filter(o => o.id !== id));
    setDetail(null);
  }

  function saveDriver() {
    if (!drvForm.name.trim()) { alert('Vui lòng nhập họ tên tài xế.'); return; }
    if (editDriver !== null) {
      saveD(drivers.map((d, i) => i === editDriver.idx ? drvForm : d));
      setEditDriver(null);
    } else {
      saveD([...drivers, drvForm]);
    }
    setDrvForm({ name: '', phone: '', plate: '', vehicle: '' });
    setShowDrv(false);
  }

  function exportCSV() {
    const rows = [['Mã lô', 'Hàng hóa', 'Trọng lượng', 'Điểm đi', 'Điểm đến', 'Tài xế', 'Trạng thái', 'Ngày tạo']];
    orders.forEach(o => rows.push([o.id, o.cargo, o.weight, o.from, o.to, o.driver, o.status, o.createdAt]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `lo-hang-${Date.now()}.csv`; a.click();
  }

  // ── NAV config ──
  const NAV = [
    { id: 'dashboard' as Page, icon: '📊', label: 'Tổng quan' },
    { id: 'orders'    as Page, icon: '📦', label: 'Lô hàng' },
    { id: 'drivers'   as Page, icon: '🚚', label: 'Tài xế' },
    { id: 'map'       as Page, icon: '🗺', label: 'Bản đồ' },   // ← MỚI
    { id: 'new-order' as Page, icon: '➕', label: 'Tạo lô hàng' },
  ];

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════
  return (
    <div style={S.body}>

      {/* ══ SIDEBAR ══ */}
      <aside style={S.sidebar}>
        <div style={S.logo}>
          <div style={S.logoIcon}>🌿</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>AgriChain</div>
            <div style={{ fontSize: 10, color: '#aaa' }}>Vận chuyển</div>
          </div>
        </div>

        <nav style={{ padding: '12px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.8px', padding: '10px 8px 6px' }}>Menu</div>

          {NAV.map(item => {
            const active = page === item.id;
            const hover  = navHover === item.id;
            return (
              <button key={item.id} className="nav-btn" onClick={() => navigate(item.id)}
                onMouseEnter={() => setNavHover(item.id)} onMouseLeave={() => setNavHover('')}
                style={{
                  background: active ? '#dcfce7' : hover ? '#f0fdf4' : 'transparent',
                  color: active || hover ? '#16a34a' : '#555',
                  fontWeight: active ? 700 : 400,
                  boxShadow: active ? 'inset 3px 0 0 #16a34a' : 'none',
                  paddingLeft: active ? 13 : 10,
                }}
              >
                <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
                {item.id === 'orders' && orders.length > 0 &&
                  <span style={{ marginLeft: 'auto', background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>{orders.length}</span>}
                {item.id === 'map' && drivers.length > 0 &&
                  <span style={{ marginLeft: 'auto', background: '#3b82f6', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>{drivers.length}</span>}
              </button>
            );
          })}

          <div style={{ margin: '10px 8px', borderTop: '1px solid #f0f0f0' }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.8px', padding: '2px 8px 6px' }}>Tra cứu</div>

          {(() => {
            const active = page === 'trace';
            const hover  = navHover === 'trace';
            return (
              <button className="nav-btn" onClick={() => navigate('trace')}
                onMouseEnter={() => setNavHover('trace')} onMouseLeave={() => setNavHover('')}
                style={{
                  background: active ? '#ecfdf5' : hover ? '#f0fdf4' : 'transparent',
                  color: active || hover ? '#059669' : '#555',
                  fontWeight: active ? 700 : 400,
                  boxShadow: active ? 'inset 3px 0 0 #059669' : 'none',
                  paddingLeft: active ? 13 : 10,
                  border: active ? '1px solid #a7f3d0' : '1px solid transparent',
                  marginTop: 2,
                }}
              >
                <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>🔍</span>
                Tra cứu QR
                <span style={{ marginLeft: 'auto', background: '#059669', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99 }}>PUBLIC</span>
              </button>
            );
          })()}
        </nav>

        <div style={{ padding: '12px 14px', borderTop: '1px solid #f0f0f0', fontSize: 11, color: '#bbb' }}>
          v1.0 · AgriChain Shipping
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main style={S.main}>
        <div key={animKey} className="page-enter" style={{ padding: page === 'map' ? '24px 28px' : '32px 36px', minHeight: '100vh' }}>

          {/* ── DASHBOARD ── */}
          {page === 'dashboard' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Tổng quan</div>
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 3 }}>{dateStr}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-press" onClick={() => navigate('map')} style={{ ...S.btn, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: 12 }}>
                    🗺 Xem bản đồ
                  </button>
                  <button className="btn-press" onClick={exportCSV} style={{ ...S.btn, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontSize: 12 }}>
                    ↓ Xuất CSV
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
                {[
                  { label: 'Tổng lô hàng',   value: stats.total,   color: '#111',    sub: 'Tất cả lô' },
                  { label: 'Đang vận chuyển', value: stats.transit, color: '#1d4ed8', sub: 'Đang đi' },
                  { label: 'Chờ xử lý',       value: stats.wait,    color: '#854d0e', sub: 'Chưa giao' },
                  { label: 'Đã hoàn thành',   value: stats.done,    color: '#15803d', sub: 'Thành công' },
                ].map(s => (
                  <div key={s.label} className="stat-card" style={S.statCard}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 30, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#bbb', marginTop: 4 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Map banner */}
              <div style={{
                background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '1px solid #bfdbfe',
                borderRadius: 12, padding: '16px 20px', marginBottom: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 28 }}>🗺</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1e3a8a' }}>Bản đồ theo dõi tài xế</div>
                    <div style={{ fontSize: 12, color: '#1d4ed8', marginTop: 2 }}>
                      {drivers.length > 0
                        ? `${drivers.length} tài xế · ${stats.transit} lô đang vận chuyển`
                        : 'Thêm tài xế để theo dõi trên bản đồ'}
                    </div>
                  </div>
                </div>
                <button className="btn-press" onClick={() => navigate('map')}
                  style={{ ...S.btn, background: '#1d4ed8', color: '#fff', whiteSpace: 'nowrap' }}>
                  Mở bản đồ →
                </button>
              </div>

              {/* Quick trace banner */}
              <div style={{
                background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #bbf7d0',
                borderRadius: 12, padding: '16px 20px', marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 28 }}>🔍</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#14532d' }}>Tra cứu nguồn gốc lô hàng</div>
                    <div style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>Khách hàng có thể tra cứu minh bạch hành trình nông sản</div>
                  </div>
                </div>
                <button className="btn-press" onClick={() => navigate('trace')}
                  style={{ ...S.btn, background: '#16a34a', color: '#fff', whiteSpace: 'nowrap' }}>
                  Mở trang tra cứu →
                </button>
              </div>

              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Lô hàng gần đây</span>
                  <button onClick={() => navigate('orders')} style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Xem tất cả →</button>
                </div>
                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ccc' }}>
                    <div style={{ fontSize: 44, marginBottom: 10 }}>📦</div>
                    <p>Chưa có lô hàng nào.</p>
                    <button onClick={() => navigate('new-order')} style={{ marginTop: 10, background: 'none', border: 'none', color: '#16a34a', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Tạo lô hàng đầu tiên →</button>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['Mã lô', 'Hàng hóa', 'Điểm đi → Điểm đến', 'Tài xế', 'Trạng thái', ''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {orders.slice().reverse().slice(0, 6).map(o => (
                        <tr key={o.id} className="trow" onClick={() => setDetail(o)}>
                          <td style={S.td}><b style={{ color: '#16a34a', fontFamily: 'monospace', fontSize: 12 }}>{o.id}</b></td>
                          <td style={S.td}>{o.cargo}</td>
                          <td style={{ ...S.td, color: '#888' }}>{o.from} → {o.to}</td>
                          <td style={{ ...S.td, color: '#888' }}>{o.driver || '—'}</td>
                          <td style={S.td}><StatusBadge status={o.status} /></td>
                          <td style={S.td} onClick={e => e.stopPropagation()}>
                            <button onClick={() => traceOrder(o.id)}
                              style={{ ...S.btn, padding: '4px 10px', fontSize: 11, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                              🔍 Trace
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── ORDERS ── */}
          {page === 'orders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Quản lý Lô hàng</div>
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 3 }}>Tất cả lô hàng vận chuyển</div>
                </div>
                <button className="btn-press" onClick={exportCSV} style={{ ...S.btn, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontSize: 12 }}>↓ Xuất CSV</button>
              </div>
              <div style={S.card}>
                <div style={{ display: 'flex', gap: 10, padding: '14px 16px', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
                  <input style={{ ...S.inp, flex: 1, minWidth: 180 } as CSSProperties} placeholder="🔍  Tìm mã lô, hàng hóa, tài xế..." value={search} onChange={e => setSearch(e.target.value)} />
                  <select style={{ ...S.inp, width: 180 } as CSSProperties} value={filterS} onChange={e => setFilterS(e.target.value)}>
                    <option value="">Tất cả trạng thái</option>
                    {['Chờ xử lý', 'Đang vận chuyển', 'Đã giao', 'Hủy'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                {filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#ccc' }}>
                    <div style={{ fontSize: 44 }}>📦</div><p>Không có lô hàng nào.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr>{['Mã lô', 'Hàng hóa', 'Trọng lượng', 'Điểm đi', 'Điểm đến', 'Tài xế', 'Ngày tạo', 'Trạng thái', ''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {filtered.map(o => (
                          <tr key={o.id} className="trow" onClick={() => setDetail(o)}>
                            <td style={S.td}><b style={{ color: '#16a34a', fontFamily: 'monospace', fontSize: 12 }}>{o.id}</b></td>
                            <td style={S.td}>{o.cargo}</td>
                            <td style={{ ...S.td, color: '#888' }}>{o.weight ? o.weight + ' kg' : '—'}</td>
                            <td style={{ ...S.td, color: '#888' }}>{o.from}</td>
                            <td style={{ ...S.td, color: '#888' }}>{o.to}</td>
                            <td style={{ ...S.td, color: '#888' }}>{o.driver || '—'}</td>
                            <td style={{ ...S.td, color: '#aaa' }}>{o.createdAt}</td>
                            <td style={S.td}><StatusBadge status={o.status} /></td>
                            <td style={S.td} onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: 5 }}>
                                <select style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #e0e0e0', borderRadius: 6, background: '#fff', cursor: 'pointer', outline: 'none' }}
                                  defaultValue="" onChange={e => { changeStatus(o.id, e.target.value); (e.target as HTMLSelectElement).value = ''; }}>
                                  <option value="" disabled>Cập nhật</option>
                                  {['Chờ xử lý', 'Đang vận chuyển', 'Đã giao', 'Hủy'].map(s => <option key={s}>{s}</option>)}
                                </select>
                                <button title="Tra cứu" onClick={() => traceOrder(o.id)}
                                  style={{ ...S.btn, padding: '4px 8px', fontSize: 12, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>🔍</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DRIVERS ── */}
          {page === 'drivers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Tài xế</div>
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 3 }}>Quản lý danh sách tài xế · {drivers.length} người</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-press" onClick={() => navigate('map')} style={{ ...S.btn, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: 12 }}>🗺 Xem bản đồ</button>
                  <button className="btn-press" onClick={() => { setDrvForm({ name: '', phone: '', plate: '', vehicle: '' }); setEditDriver(null); setShowDrv(true); }}
                    style={{ ...S.btn, background: '#16a34a', color: '#fff' }}>+ Thêm tài xế</button>
                </div>
              </div>
              <div style={S.card}>
                {drivers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#ccc' }}>
                    <div style={{ fontSize: 44 }}>🚚</div><p>Chưa có tài xế nào.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['Họ tên', 'Điện thoại', 'Biển số', 'Loại xe', 'Lô đang giao', ''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {drivers.map((d, i) => {
                        const cnt = orders.filter(o => o.driver === d.name && o.status === 'Đang vận chuyển').length;
                        return (
                          <tr key={i} className="trow" style={{ cursor: 'default' }}>
                            <td style={S.td}><b>{d.name}</b></td>
                            <td style={{ ...S.td, color: '#888' }}>{d.phone || '—'}</td>
                            <td style={{ ...S.td, color: '#888' }}>{d.plate || '—'}</td>
                            <td style={{ ...S.td, color: '#888' }}>{d.vehicle || '—'}</td>
                            <td style={S.td}>
                              {cnt > 0
                                ? <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{cnt} lô</span>
                                : <span style={{ color: '#bbb', fontSize: 12 }}>Rảnh</span>}
                            </td>
                            <td style={S.td}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn-press" onClick={() => { setDrvForm(d); setEditDriver({ idx: i, data: d }); setShowDrv(true); }}
                                  style={{ ...S.btn, padding: '4px 10px', fontSize: 12, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>Sửa</button>
                                <button className="btn-press" onClick={() => { if (confirm('Xóa tài xế này?')) saveD(drivers.filter((_, j) => j !== i)); }}
                                  style={{ ...S.btn, padding: '4px 10px', fontSize: 12, background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>Xóa</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── MAP ── */}
          {page === 'map' && (
            <MapPage drivers={drivers} orders={orders} />
          )}

          {/* ── NEW ORDER ── */}
          {page === 'new-order' && (
            <div style={{ maxWidth: 680 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 4 }}>Tạo Lô hàng mới</div>
              <div style={{ fontSize: 12, color: '#aaa', marginBottom: 24 }}>Điền thông tin để tạo chuyến hàng</div>
              <div style={{ ...S.card, padding: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <Field label="Hàng hóa *" value={form.cargo} onChange={v => setForm(f => ({ ...f, cargo: v }))} placeholder="Gạo, cà phê, rau củ..." />
                    <Field label="Nông trại" value={form.farm} onChange={v => setForm(f => ({ ...f, farm: v }))} placeholder="Farm ABC" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <Field label="Trọng lượng (kg)" value={form.weight} onChange={v => setForm(f => ({ ...f, weight: v }))} placeholder="500" type="number" />
                    <Field label="Số kiện" value={form.qty} onChange={v => setForm(f => ({ ...f, qty: v }))} placeholder="10" type="number" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <ProvinceInput label="Điểm xuất phát *" value={form.from} onChange={v => setForm(f => ({ ...f, from: v }))} placeholder="Chọn tỉnh/thành..." />
                    <ProvinceInput label="Điểm đến *" value={form.to} onChange={v => setForm(f => ({ ...f, to: v }))} placeholder="Chọn tỉnh/thành..." />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    <Field label="Ngày giao" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" />
                    <Field label="Giờ giao" value={form.time} onChange={v => setForm(f => ({ ...f, time: v }))} type="time" />
                    <div>
                      <label style={S.label}>Tài xế</label>
                      <select style={S.inp as CSSProperties} value={form.driver} onChange={e => setForm(f => ({ ...f, driver: e.target.value }))}>
                        <option value="">-- Chọn tài xế --</option>
                        {drivers.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={S.label}>Ghi chú</label>
                    <textarea style={{ ...S.inp, minHeight: 72, resize: 'vertical' } as CSSProperties}
                      placeholder="Hàng dễ vỡ, cần bảo quản lạnh..."
                      value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                    <button onClick={() => setForm(emptyForm)} style={{ ...S.btn, background: '#fff', color: '#555', border: '1px solid #e0e0e0' }}>Xóa form</button>
                    <button className="btn-press" onClick={submitOrder} style={{ ...S.btn, background: '#16a34a', color: '#fff' }}>✅ Tạo lô hàng</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TRACE ── */}
          {page === 'trace' && (
            <div style={{ maxWidth: 680 }}>
              <div style={{ marginBottom: 24 }}>
                <div className="shimmer" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Tra cứu Lô hàng</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Nhập mã lô hàng hoặc quét QR để xem hành trình vận chuyển minh bạch</div>
              </div>

              <div style={{ background: '#fff', borderRadius: 16, border: '2px solid #e5e7eb', padding: '20px 22px', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                  <QRFrame size={64} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Nhập mã lô hàng</div>
                    <input ref={traceInputRef} className="trace-inp" value={traceQ}
                      onChange={e => { setTraceQ(e.target.value); setTraceResult(null); }}
                      onKeyDown={e => e.key === 'Enter' && doTrace()}
                      placeholder="VD: LH0001-A1B2 hoặc nhập một phần mã..."
                      autoComplete="off" />
                  </div>
                </div>
                <button onClick={() => doTrace()} disabled={traceLoading || !traceQ.trim()} style={{
                  width: '100%', padding: '12px',
                  background: traceLoading || !traceQ.trim() ? '#d1d5db' : '#16a34a',
                  color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: traceLoading || !traceQ.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s',
                }}>
                  {traceLoading
                    ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spinRing .7s linear infinite' }} />Đang tìm...</>
                    : <>🔍 Tra cứu ngay</>}
                </button>
                {orders.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>Chọn nhanh:</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {orders.slice().reverse().slice(0, 5).map(o => (
                        <button key={o.id} onClick={() => { setTraceQ(o.id); doTrace(o.id); }}
                          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace' }}>
                          {o.id}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {traceResult === 'not-found' && (
                <div style={{ textAlign: 'center', padding: '40px 24px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, animation: 'fadeSlideIn .3s ease' }}>
                  <div style={{ fontSize: 44, marginBottom: 10 }}>🔎</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#9a3412', marginBottom: 6 }}>Không tìm thấy lô hàng</div>
                  <div style={{ fontSize: 13, color: '#c2410c' }}>Mã <b>"{traceQ}"</b> không tồn tại trong hệ thống.</div>
                </div>
              )}

              {traceResult && traceResult !== 'not-found' && (() => {
                const o = traceResult;
                const timeline = [...(o.timeline || [])].reverse();
                return (
                  <div style={{ animation: 'fadeSlideIn .35s ease' }}>
                    <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #bbf7d0', borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 5 }}>Mã lô hàng</div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: '#14532d', fontFamily: 'monospace', letterSpacing: 1 }}>{o.id}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                          <StatusBadge status={o.status} />
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => copyId(o.id)} style={{ ...S.btn, padding: '5px 12px', fontSize: 11, background: '#fff', color: '#16a34a', border: '1px solid #bbf7d0' }}>📋 Copy mã</button>
                            <button onClick={() => setDetail(o)} style={{ ...S.btn, padding: '5px 12px', fontSize: 11, background: '#16a34a', color: '#fff' }}>📄 Chi tiết</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 10, marginBottom: 16 }}>
                      {[
                        { icon: '📦', label: 'Hàng hóa', v: o.cargo || '—' },
                        { icon: '⚖️', label: 'Trọng lượng', v: o.weight ? o.weight + ' kg' : '—' },
                        { icon: '🌿', label: 'Nông trại', v: o.farm || '—' },
                        { icon: '🚚', label: 'Tài xế', v: o.driver || 'Chưa phân công' },
                        { icon: '📅', label: 'Ngày dự kiến', v: o.date || '—' },
                        { icon: '🗓', label: 'Ngày tạo', v: o.createdAt },
                      ].map(({ icon, label, v }) => (
                        <div key={label} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: '12px 14px' }}>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>{icon} {label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 22px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 100 }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Xuất phát</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginTop: 3 }}>📍 {o.from}</div>
                      </div>
                      <div style={{ flex: 2, minWidth: 80, display: 'flex', alignItems: 'center' }}>
                        <div style={{ flex: 1, height: 2, background: 'linear-gradient(90deg,#16a34a,#86efac)' }} />
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🚚</div>
                        <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg,#86efac,#16a34a)`, opacity: o.status === 'Đã giao' ? 1 : 0.25 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 100, textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Điểm đến</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginTop: 3 }}>🏁 {o.to}</div>
                      </div>
                    </div>
                    {timeline.length > 0 && (
                      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 22px' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 18 }}>📋 Lịch sử hành trình</div>
                        {timeline.map((ev, i) => (
                          <TLItem key={i} ev={ev} isFirst={i === 0} isLast={i === timeline.length - 1} />
                        ))}
                      </div>
                    )}
                    {o.note && (
                      <div style={{ marginTop: 14, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#92400e' }}>
                        📝 <b>Ghi chú:</b> {o.note}
                      </div>
                    )}
                  </div>
                );
              })()}

              {!traceResult && !traceLoading && orders.length === 0 && (
                <div style={{ textAlign: 'center', padding: 32, background: '#f9fafb', borderRadius: 14, border: '1px dashed #e5e7eb' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>Chưa có lô hàng nào.</div>
                  <button onClick={() => navigate('new-order')} style={{ marginTop: 12, ...S.btn, background: '#16a34a', color: '#fff', fontSize: 12 }}>+ Tạo lô hàng</button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ══ MODAL: ORDER DETAIL ══ */}
      {detail && (
        <div style={S.overlay} onClick={() => setDetail(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Chi tiết Lô hàng</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setDetail(null); traceOrder(detail.id); }}
                  style={{ ...S.btn, padding: '5px 12px', fontSize: 12, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>🔍 Tra cứu</button>
                <button onClick={() => copyId(detail.id)}
                  style={{ ...S.btn, padding: '5px 12px', fontSize: 12, background: '#f9fafb', color: '#555', border: '1px solid #e0e0e0' }}>📋 Copy mã</button>
              </div>
            </div>
            {([
              ['Mã lô hàng', detail.id], ['Hàng hóa', detail.cargo],
              ['Trọng lượng', detail.weight ? detail.weight + ' kg' : '—'], ['Số kiện', detail.qty || '—'],
              ['Nông trại', detail.farm || '—'], ['Điểm xuất phát', detail.from], ['Điểm đến', detail.to],
              ['Tài xế', detail.driver || '—'], ['Ngày giao', (detail.date || '—') + ' ' + (detail.time || '')],
              ['Ghi chú', detail.note || '—'],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', padding: '9px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                <span style={{ color: '#888', width: 150, flexShrink: 0 }}>{k}</span>
                <span style={{ color: '#111', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', padding: '9px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
              <span style={{ color: '#888', width: 150, flexShrink: 0 }}>Trạng thái</span>
              <StatusBadge status={detail.status} />
            </div>
            <div style={{ margin: '14px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#888', flexShrink: 0 }}>Cập nhật trạng thái:</span>
              <select style={{ ...S.inp, flex: 1, fontSize: 13 } as CSSProperties} value={detail.status}
                onChange={e => changeStatus(detail.id, e.target.value)}>
                {['Chờ xử lý', 'Đang vận chuyển', 'Đã giao', 'Hủy'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginTop: 18, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>📋 Lịch sử vận chuyển</div>
            <div style={{ borderLeft: '2px solid #e8eaf0', marginLeft: 8, paddingLeft: 18 }}>
              {[...(detail.timeline || [])].reverse().map((t, i) => (
                <div key={i} style={{ position: 'relative', paddingBottom: 16 }}>
                  <div style={{ position: 'absolute', left: -25, top: 3, width: 14, height: 14, borderRadius: '50%', background: '#16a34a', border: '2px solid #fff', boxShadow: '0 0 0 2px #16a34a' }} />
                  <div style={{ fontSize: 11, color: '#aaa' }}>{t.time}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{t.desc}</div>
                </div>
              ))}
            </div>
            {/* ── QR Code ── */}
            <div style={{
              marginTop: 20, padding: '18px 20px',
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 12, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
            }}>
              <div style={{ flexShrink: 0, background: '#fff', padding: 10, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
                <QRCodeCanvas
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/trace?id=${detail.id}`}
                  size={110}
                  level="M"
                  includeMargin={false}
                  id={`qr-${detail.id}`}
                />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#14532d', marginBottom: 4 }}>🔲 QR Code lô hàng</div>
                <div style={{ fontSize: 12, color: '#15803d', marginBottom: 10, lineHeight: 1.5 }}>
                  Dán QR này lên kiện hàng. Khách hàng quét để tra cứu hành trình vận chuyển.
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#065f46', background: '#dcfce7', padding: '4px 10px', borderRadius: 6, display: 'inline-block', marginBottom: 12 }}>
                  {detail.id}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn-press" onClick={() => {
                    const canvas = document.getElementById(`qr-${detail.id}`) as HTMLCanvasElement;
                    if (!canvas) return;
                    const a = document.createElement('a');
                    a.href = canvas.toDataURL('image/png');
                    a.download = `QR-${detail.id}.png`;
                    a.click();
                    showToast('✅ Đã tải QR: ' + detail.id);
                  }} style={{ ...S.btn, padding: '7px 14px', fontSize: 12, background: '#16a34a', color: '#fff' }}>
                    ⬇ Tải QR (.png)
                  </button>
                  <button className="btn-press" onClick={() => {
                    const canvas = document.getElementById(`qr-${detail.id}`) as HTMLCanvasElement;
                    const printWin = window.open('', '_blank');
                    if (!printWin || !canvas) return;
                    printWin.document.write(`
                      <html><head><title>QR - ${detail.id}</title>
                      <style>
                        body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff;}
                        .wrap{text-align:center;padding:32px;border:2px dashed #16a34a;border-radius:16px;}
                        h2{color:#14532d;margin:0 0 4px;font-size:18px;}
                        p{color:#6b7280;font-size:12px;margin:0 0 16px;}
                        .id{font-family:monospace;font-size:15px;font-weight:700;color:#065f46;background:#dcfce7;padding:6px 14px;border-radius:8px;display:inline-block;margin-top:14px;}
                      </style></head>
                      <body><div class="wrap">
                        <h2>AgriChain Shipping</h2>
                        <p>Quét mã QR để tra cứu hành trình lô hàng</p>
                        <img src="${canvas.toDataURL()}" width="160" height="160"/>
                        <div class="id">${detail.id}</div>
                      </div></body></html>
                    `);
                    printWin.document.close();
                    setTimeout(() => printWin.print(), 400);
                  }} style={{ ...S.btn, padding: '7px 14px', fontSize: 12, background: '#fff', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                    🖨 In QR
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setDetail(null)} style={{ ...S.btn, background: '#fff', color: '#555', border: '1px solid #e0e0e0' }}>Đóng</button>
              <button onClick={() => deleteOrder(detail.id)} style={{ ...S.btn, background: '#fee2e2', color: '#dc2626' }}>🗑 Xóa lô hàng</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: DRIVER ══ */}
      {showDrv && (
        <div style={S.overlay} onClick={() => setShowDrv(false)}>
          <div style={{ ...S.modal, width: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 18 }}>{editDriver ? 'Sửa Tài xế' : 'Thêm Tài xế'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={S.label}>Họ tên *</label>
                <input style={S.inp as CSSProperties} placeholder="Nguyễn Văn A" value={drvForm.name} onChange={e => setDrvForm(d => ({ ...d, name: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>Số điện thoại</label>
                  <input style={S.inp as CSSProperties} placeholder="0901 234 567" value={drvForm.phone} onChange={e => setDrvForm(d => ({ ...d, phone: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>Biển số xe</label>
                  <input style={S.inp as CSSProperties} placeholder="51F-12345" value={drvForm.plate} onChange={e => setDrvForm(d => ({ ...d, plate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={S.label}>Loại xe</label>
                <select style={S.inp as CSSProperties} value={drvForm.vehicle} onChange={e => setDrvForm(d => ({ ...d, vehicle: e.target.value }))}>
                  <option value="">-- Chọn loại xe --</option>
                  <option>Xe tải</option><option>Xe tải lạnh</option><option>Xe van</option><option>Xe máy</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowDrv(false)} style={{ ...S.btn, background: '#fff', color: '#555', border: '1px solid #e0e0e0' }}>Hủy</button>
              <button onClick={saveDriver} style={{ ...S.btn, background: '#16a34a', color: '#fff' }}>{editDriver ? 'Lưu thay đổi' : 'Thêm tài xế'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ TOAST ══ */}
      {toast && <div className="toast">{toast}</div>}

    </div>
  );
}