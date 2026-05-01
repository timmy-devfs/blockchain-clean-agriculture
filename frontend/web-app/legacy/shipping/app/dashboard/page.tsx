'use client';

import { useState, useEffect, useCallback, useRef, CSSProperties } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import jsQR from 'jsqr';
import { useSyncOrders } from '../hooks/useSyncOrders';
import { ShippingApi, type Shipment } from '../lib/shippingApi';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Order {
  id: string; cargo: string; weight: string; qty: string; farm: string;
  from: string; to: string; date: string; time: string; driver: string;
  driverPhone?: string; driverPlate?: string; driverVehicle?: string;
  status: string; note: string; createdAt: string;
  productImage?: string;
  timeline: { time: string; label: string; desc: string }[];
}
interface Driver {
  name: string;
  phone: string;
  plate: string;
  vehicle: string;
  cccd?: string;
  image?: string;
}
type Page = 'dashboard' | 'orders' | 'drivers' | 'new-order' | 'trace' | 'map';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function genId(orders: Order[]) {
  return 'LH' + String(orders.length + 1).padStart(4, '0') + '-' + Date.now().toString(36).toUpperCase().slice(-4);
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  'Chờ xử lý':       { bg: '#fef9c3', color: '#854d0e' },
  'Đã lấy hàng':     { bg: '#ede9fe', color: '#6d28d9' },
  'Đang vận chuyển': { bg: '#dbeafe', color: '#1d4ed8' },
  'Đã giao':          { bg: '#dcfce7', color: '#15803d' },
  'Hủy':              { bg: '#fee2e2', color: '#dc2626' },
};
const STATUS_DOT: Record<string, string> = {
  'Chờ xử lý': '#f59e0b', 'Đã lấy hàng': '#7c3aed', 'Đang vận chuyển': '#3b82f6', 'Đã giao': '#10b981', 'Hủy': '#ef4444',
};

// ─── Shared style tokens ──────────────────────────────────────────────────────
const S: Record<string, CSSProperties> = {
  body:     { display: 'flex', minHeight: '100vh', background: 'linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%)', fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif", color: '#0f172a' },
  sidebar:  { position: 'fixed', top: 0, left: 0, width: 228, height: '100vh', background: '#fff', borderRight: '1px solid #e8eaf0', display: 'flex', flexDirection: 'column', zIndex: 100 },
  logo:     { display: 'flex', alignItems: 'center', gap: 10, padding: '18px 16px', borderBottom: '1px solid #e8eaf0' },
  logoIcon: { width: 36, height: 36, borderRadius: 8, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
  main:     { marginLeft: 0, flex: 1, minHeight: '100vh', position: 'relative', overflow: 'hidden' },
  card:     { background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 12px 28px rgba(15,23,42,.05)' },
  statCard: { background: '#fff', borderRadius: 16, border: '1px solid #dbe3ee', padding: '20px 22px', flex: 1, minHeight: 132, boxShadow: '0 8px 22px rgba(15,23,42,.06)' },
  inp:      { width: '100%', padding: '11px 13px', border: '1px solid #dbe2ea', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: '#0f172a' } as CSSProperties,
  btn:      { padding: '10px 18px', borderRadius: 10, border: '1px solid transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  th:       { padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.45px', color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e8edf3', whiteSpace: 'nowrap' } as CSSProperties,
  td:       { padding: '12px 14px', fontSize: 13, color: '#334155', borderBottom: '1px solid #eef2f7' },
  label:    { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 },
  overlay:  { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal:    { background: '#fff', borderRadius: 20, padding: 28, width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 70px rgba(15,23,42,.28)', border: '1px solid #e2e8f0' },
};

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

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
    padding:10px 11px; border-radius:8px; font-size:14.5px;
    border:none; cursor:pointer; margin-bottom:2px; text-align:left;
    transition: background 0.15s, color 0.15s, box-shadow 0.15s;
    font-family: inherit;
  }
  .nav-btn:active { transform:scale(.97); }

  .stat-card { transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s; cursor: default; }
  .stat-card:hover { box-shadow: 0 14px 30px rgba(15,23,42,.1); transform:translateY(-2px); border-color:#cfd9e7; }

  .trow { transition: background 0.12s; cursor:pointer; }
  .trow:hover { background: #f8fbff !important; }

  .btn-press { transition: transform 0.1s, box-shadow 0.1s; }
  .btn-press:hover  { transform:translateY(-1px); box-shadow:0 10px 22px rgba(15,23,42,.14); }
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
    width:100%; padding:14px 16px; border:1px solid #dbe2ea; border-radius:12px;
    font-size:15px; font-family:inherit; outline:none;
    transition: border-color 0.2s, box-shadow 0.2s; background:#fff;
  }
  .trace-inp:focus { border-color:#16a34a; box-shadow:0 0 0 4px rgba(22,163,74,.08); }
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

  /* Shipping map layout */
  .shipmap-wrap { display:flex; flex-direction:column; gap:8px; height:calc(100vh - 120px); min-height:620px; font-family:'Be Vietnam Pro','Segoe UI',sans-serif; }
  .shipmap-topbar {
    background:#fff; border:1px solid #dde3ec; border-radius:10px;
    height:44px; padding:0 12px; display:flex; align-items:center; gap:10px;
  }
  .shipmap-topbar-title { font-size:14px; font-weight:700; color:#1c2128; }
  .shipmap-topbar-sub { font-size:11px; color:#57606a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .shipmap-topbar-actions { margin-left:auto; display:flex; gap:6px; }
  .shipmap-chip {
    border:1px solid #dde3ec; border-radius:99px; background:#f0f4f8; color:#57606a;
    padding:3px 9px; font-size:10.5px; font-weight:600; display:flex; align-items:center; gap:5px;
  }
  .shipmap-chip.live { color:#1a7f37; border-color:#86efac; background:rgba(26,127,55,.1); }
  .shipmap-live-dot { width:6px; height:6px; border-radius:50%; background:#1a7f37; }

  .shipmap-content { display:grid; grid-template-columns:300px minmax(0,1fr); gap:8px; flex:1; min-height:0; }
  .shipmap-panel {
    background:#fff; border:1px solid #dde3ec; border-radius:10px;
    display:flex; flex-direction:column; overflow:hidden; min-height:0;
  }
  .shipmap-panel-header { padding:10px 12px; border-bottom:1px solid #dde3ec; display:flex; align-items:center; gap:8px; }
  .shipmap-panel-header h2 { font-size:12px; font-weight:700; color:#1c2128; }
  .shipmap-count { margin-left:auto; font-size:10px; color:#57606a; background:#f0f4f8; border:1px solid #dde3ec; border-radius:99px; padding:1px 7px; font-family:'JetBrains Mono',monospace; }
  .shipmap-scroll { flex:1; overflow-y:auto; }
  .shipmap-legend {
    border-top:1px solid #dde3ec; background:#f0f4f8; padding:9px 12px;
    display:grid; grid-template-columns:1fr 1fr; gap:5px 8px;
  }
  .shipmap-legend-item { display:flex; align-items:center; gap:6px; font-size:10px; color:#57606a; }
  .shipmap-route-line { width:16px; height:3px; border-radius:2px; background:#16a34a; }
  .shipmap-dot-green { width:10px; height:10px; border-radius:50%; background:#16a34a; }
  .shipmap-dot-red { width:10px; height:10px; border-radius:3px; background:#cf222e; }
  .shipmap-dot-truck { width:13px; height:9px; border-radius:3px; background:#bc4c00; }
  .shipmap-dot-truck2 { width:13px; height:9px; border-radius:3px; background:#9a6700; }

  .shipmap-map {
    position:relative; overflow:hidden; border-radius:10px; border:1px solid #dde3ec; background:#fff; min-height:0;
  }
  .shipmap-overlay { position:absolute; right:10px; top:10px; z-index:1000; display:flex; flex-direction:column; gap:6px; }
  .shipmap-overlay-card {
    background:rgba(255,255,255,.92); border:1px solid #dde3ec; border-radius:8px; min-width:130px; padding:8px 11px;
  }
  .shipmap-overlay-card .lbl { font-size:10px; color:#57606a; margin-bottom:2px; }
  .shipmap-overlay-card .val { font-size:22px; line-height:1; font-weight:800; font-family:'JetBrains Mono',monospace; }
  .shipmap-bottom {
    position:absolute; left:0; right:0; bottom:0; z-index:1000; height:38px;
    background:rgba(255,255,255,.93); border-top:1px solid #dde3ec;
    display:grid; grid-template-columns:1.4fr 1fr 1.4fr; align-items:center;
  }
  .shipmap-bottom-item { height:100%; padding:0 12px; display:flex; align-items:center; gap:6px; font-size:11px; color:#57606a; border-right:1px solid #dde3ec; }
  .shipmap-bottom-item:last-child { border-right:none; }
  .shipmap-bottom-item b { color:#1c2128; font-weight:600; }

  .ui-empty-compact { padding: 26px 18px !important; }
`;

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLOR[status] ?? { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{ background: c.bg, color: c.color, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid rgba(148,163,184,.2)' }}>
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
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>{label}</label>
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

  useEffect(() => { setQuery(value); }, [value]);

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
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>{label}</label>
      <input
        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${open ? '#16a34a' : '#dbe2ea'}`,
          borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit',
          boxSizing: 'border-box' as const, background: '#fff',
          boxShadow: open ? '0 0 0 3px rgba(22,163,74,.08)' : 'none', transition: 'all .15s' }}
        placeholder={placeholder}
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
          background: '#fff', border: '1px solid #dbe2ea', borderRadius: 10,
          boxShadow: '0 12px 24px rgba(15,23,42,.14)', marginTop: 4,
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

// ─── Bảng tọa độ 63 tỉnh/thành (INLINE — không cần file ngoài) ───────────────
// FIX CHÍNH: Bỏ dependency resolveProvinceCoords từ file ngoài,
// thay bằng bảng tọa độ đầy đủ với alias để tránh lỗi "không tìm được tọa độ"
const VN_COORDS: Record<string, [number, number]> = {
  // ── Miền Bắc ──
  'Hà Nội': [21.0285, 105.8542],
  'Hải Phòng': [20.8449, 106.6881],
  'Hải Dương': [20.9373, 106.3143],
  'Hưng Yên': [20.6464, 106.0511],
  'Hà Nam': [20.5418, 105.9221],
  'Nam Định': [20.4388, 106.1621],
  'Thái Bình': [20.4463, 106.3366],
  'Ninh Bình': [20.2506, 105.9745],
  'Vĩnh Phúc': [21.3609, 105.5474],
  'Bắc Ninh': [21.1861, 106.0763],
  'Bắc Giang': [21.2731, 106.1944],
  'Phú Thọ': [21.3451, 105.2141],
  'Thái Nguyên': [21.5944, 105.8480],
  'Hòa Bình': [20.8135, 105.3386],
  'Sơn La': [21.3272, 103.9144],
  'Điện Biên': [21.3860, 103.0230],
  'Lai Châu': [22.3964, 103.4589],
  'Lào Cai': [22.4809, 103.9754],
  'Yên Bái': [21.7051, 104.8754],
  'Tuyên Quang': [21.7767, 105.2280],
  'Hà Giang': [22.8026, 104.9784],
  'Cao Bằng': [22.6657, 106.2522],
  'Bắc Kạn': [22.1473, 105.8348],
  'Lạng Sơn': [21.8537, 106.7613],
  'Quảng Ninh': [21.0064, 107.2925],
  // ── Miền Trung ──
  'Thanh Hóa': [19.8072, 105.7852],
  'Nghệ An': [19.2342, 104.9200],
  'Hà Tĩnh': [18.3558, 105.8877],
  'Quảng Bình': [17.4682, 106.5987],
  'Quảng Trị': [16.7403, 107.1854],
  'Thừa Thiên Huế': [16.4674, 107.5905],
  'Đà Nẵng': [16.0544, 108.2022],
  'Quảng Nam': [15.5394, 108.0191],
  'Quảng Ngãi': [15.1214, 108.8049],
  'Bình Định': [13.7765, 109.2237],
  'Phú Yên': [13.0882, 109.0929],
  'Khánh Hòa': [12.2388, 109.1967],
  'Ninh Thuận': [11.5646, 108.9884],
  'Bình Thuận': [10.9282, 108.1009],
  // ── Tây Nguyên ──
  'Kon Tum': [14.3497, 107.9999],
  'Gia Lai': [13.8079, 108.1094],
  'Đắk Lắk': [12.6740, 108.0378],
  'Đắk Nông': [12.0046, 107.6875],
  'Lâm Đồng': [11.5753, 108.1429],
  // ── Đông Nam Bộ ──
  'TP. Hồ Chí Minh': [10.8231, 106.6297],
  'Bình Phước': [11.7511, 106.9147],
  'Tây Ninh': [11.3352, 106.1099],
  'Bình Dương': [11.3254, 106.4770],
  'Đồng Nai': [10.9452, 107.0843],
  'Bà Rịa - Vũng Tàu': [10.5417, 107.2429],
  // ── Tây Nam Bộ ──
  'Long An': [10.5354, 106.4052],
  'Tiền Giang': [10.4493, 106.3421],
  'Bến Tre': [10.2433, 106.3756],
  'Trà Vinh': [9.9349, 106.3451],
  'Vĩnh Long': [10.2397, 106.0196],
  'Đồng Tháp': [10.4938, 105.6882],
  'An Giang': [10.3866, 105.4356],
  'Kiên Giang': [10.0122, 105.0809],
  'Cần Thơ': [10.0452, 105.7469],
  'Hậu Giang': [9.7579, 105.6413],
  'Sóc Trăng': [9.6025, 105.9739],
  'Bạc Liêu': [9.2940, 105.7278],
  'Cà Mau': [9.1769, 105.1504],
};

// Alias phổ biến người dùng hay nhập
const VN_ALIASES: Record<string, string> = {
  'HCM': 'TP. Hồ Chí Minh',
  'Hồ Chí Minh': 'TP. Hồ Chí Minh',
  'TPHCM': 'TP. Hồ Chí Minh',
  'Tp HCM': 'TP. Hồ Chí Minh',
  'TP HCM': 'TP. Hồ Chí Minh',
  'Saigon': 'TP. Hồ Chí Minh',
  'Sài Gòn': 'TP. Hồ Chí Minh',
  'HN': 'Hà Nội',
  'Hanoi': 'Hà Nội',
  'HP': 'Hải Phòng',
  'DN': 'Đà Nẵng',
  'Da Nang': 'Đà Nẵng',
  'Hue': 'Thừa Thiên Huế',
  'Huế': 'Thừa Thiên Huế',
  'CT': 'Cần Thơ',
  'Can Tho': 'Cần Thơ',
  'BT': 'Bến Tre',
  'CB': 'Cao Bằng',
  'VT': 'Bà Rịa - Vũng Tàu',
  'Vũng Tàu': 'Bà Rịa - Vũng Tàu',
  'Vung Tau': 'Bà Rịa - Vũng Tàu',
  'Đà Lạt': 'Lâm Đồng',
  'Da Lat': 'Lâm Đồng',
  'Nha Trang': 'Khánh Hòa',
  'Phan Thiết': 'Bình Thuận',
  'Phan Rang': 'Ninh Thuận',
  'Buôn Ma Thuột': 'Đắk Lắk',
  'Ban Me Thuot': 'Đắk Lắk',
  'Pleiku': 'Gia Lai',
  'Qui Nhơn': 'Bình Định',
  'Quy Nhon': 'Bình Định',
  'Hội An': 'Quảng Nam',
  'Hoi An': 'Quảng Nam',
};

/**
 * Tra tọa độ tỉnh/thành từ bảng inline.
 * Hỗ trợ: tên đầy đủ, alias, tìm kiếm fuzzy (contains).
 */
function resolveProvinceCoords(name: string): [number, number] | null {
  if (!name || !name.trim()) return null;
  const raw = name.trim();

  // 1. Khớp exact
  if (VN_COORDS[raw]) return VN_COORDS[raw];

  // 2. Alias
  const aliased = VN_ALIASES[raw];
  if (aliased && VN_COORDS[aliased]) return VN_COORDS[aliased];

  // 3. Tìm không dấu / case-insensitive (fuzzy)
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const rawN = normalize(raw);

  for (const [key, coord] of Object.entries(VN_COORDS)) {
    if (normalize(key).includes(rawN) || rawN.includes(normalize(key))) {
      return coord;
    }
  }

  return null;
}

// ─── Cache geocoding / tuyến đường ───────────────────────────────────────────
const geocodeCache: Record<string, [number, number]> = {};
const routeCache: Record<string, [number, number][]> = {};
const VN_BOUNDS = { minLat: 8.1, maxLat: 23.8, minLon: 102.0, maxLon: 110.8 };
const VN_BACKBONE_POINTS: [number, number][] = [
  [10.8231, 106.6297], // TP.HCM
  [10.9804, 107.2613], // Biên Hòa
  [10.9330, 108.1020], // Phan Thiết
  [12.2388, 109.1967], // Nha Trang
  [13.7820, 109.2196], // Quy Nhơn
  [16.0544, 108.2022], // Đà Nẵng
  [16.4637, 107.5909], // Huế
  [17.4682, 106.5987], // Quảng Bình
  [18.6796, 105.6813], // Vinh
  [19.8067, 105.7760], // Thanh Hóa
  [20.2506, 105.9745], // Ninh Bình
  [21.0285, 105.8542], // Hà Nội
];

function isCoordInVietnam(coord: [number, number]): boolean {
  const [lat, lon] = coord;
  return (
    lat >= VN_BOUNDS.minLat && lat <= VN_BOUNDS.maxLat &&
    lon >= VN_BOUNDS.minLon && lon <= VN_BOUNDS.maxLon
  );
}

function geoDistKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

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

function buildVietnamWaypoints(from: [number, number], to: [number, number]): [number, number][] {
  const minLat = Math.min(from[0], to[0]);
  const maxLat = Math.max(from[0], to[0]);
  const middle = VN_BACKBONE_POINTS.filter((p) => p[0] > minLat && p[0] < maxLat);
  const ordered = (from[0] <= to[0]) ? middle : middle.slice().reverse();
  return [from, ...ordered, to];
}

async function fetchJsonTimeout(url: string, timeoutMs: number): Promise<unknown> {
  const ctrl = new AbortController();
  const tid = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const text = await res.text();
    try { return JSON.parse(text) as unknown; } catch { return {}; }
  } catch { return {}; } finally { window.clearTimeout(tid); }
}

async function geocodeAddress(address: string): Promise<[number, number] | null> {
  const key = address.trim();
  if (!key) return null;
  if (geocodeCache[key]) return geocodeCache[key];

  // Bước 1: tra bảng tỉnh/thành inline — không cần mạng, không lỗi
  const local = resolveProvinceCoords(key);
  if (local) {
    geocodeCache[key] = local;
    return local;
  }

  // Bước 2: fallback gọi API geocode nếu có
  try {
    const data = (await fetchJsonTimeout(`/api/geocode?q=${encodeURIComponent(key + ', Vietnam')}`, 10_000)) as {
      lat?: number | null; lon?: number | null;
    };
    if (typeof data.lat === 'number' && typeof data.lon === 'number') {
      const coord: [number, number] = [data.lat, data.lon];
      if (!isCoordInVietnam(coord)) {
        console.warn('[map] Geocode nằm ngoài VN, bỏ qua:', key, coord);
        return null;
      }
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
  const fetchLegRoute = async (a: [number, number], b: [number, number]): Promise<[number, number][] | null> => {
    const params = new URLSearchParams({
      fromLon: String(a[1]), fromLat: String(a[0]),
      toLon: String(b[1]),   toLat: String(b[0]),
    });
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const data = (await fetchJsonTimeout(`/api/osrm?${params}`, 14_000)) as {
          code?: string;
          routes?: { geometry: { coordinates: [number, number][] } }[];
        };
        if (data.code === 'Ok' && data.routes?.[0]) {
          return data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 180));
    }
    return null;
  };

  const direct = await fetchLegRoute(from, to);
  if (direct && direct.length > 1) {
    const outsideRatio = direct.reduce((n, c) => n + (isCoordInVietnam(c) ? 0 : 1), 0) / direct.length;
    const latDiff = Math.abs(from[0] - to[0]);
    const lonDiff = Math.abs(from[1] - to[1]);
    const isLongTrip = geoDistKm(from, to) > 260 || latDiff > 2.4 || lonDiff > 2.4;
    // Chỉ nhận tuyến direct cho chặng ngắn để tránh route "đi tắt" ra nước ngoài ở chặng dài.
    if (!isLongTrip && outsideRatio <= 0.05) {
      routeCache[key] = direct;
      return direct;
    }
  }

  // Tuyến dài dễ bị route engine kéo qua biên giới; ép đi theo "xương sống" Việt Nam.
  const waypoints = buildVietnamWaypoints(from, to);
  const merged: [number, number][] = [];
  for (let i = 1; i < waypoints.length; i++) {
    const leg = await fetchLegRoute(waypoints[i - 1], waypoints[i]);
    if (!leg || leg.length === 0) {
      console.warn('[map] Không lấy được route cho chặng:', waypoints[i - 1], '->', waypoints[i]);
      return [];
    }
    if (merged.length === 0) merged.push(...leg);
    else merged.push(...leg.slice(1));
  }

  if (merged.length > 1) {
    routeCache[key] = merged;
    return merged;
  }

  // Không trả về đường thẳng giả; để UI chỉ hiển thị marker khi route không khả dụng.
  return [];
}

const ROUTE_COLORS = ['#16a34a', '#2563eb', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#ea580c'];

// ─── Map Page Component ───────────────────────────────────────────────────────
function MapPage({ drivers, orders }: { drivers: Driver[]; orders: Order[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const orderLayersRef = useRef<Record<string, any[]>>({});
  const ordersRef = useRef<Order[]>(orders);
  useEffect(() => { ordersRef.current = orders; }, [orders]);

  const activeOrders    = orders.filter(o => o.status === 'Đang vận chuyển');
  const deliveredOrders = orders.filter(o => o.status === 'Đã giao');

  const stats = {
    total:   drivers.length,
    onRoute: drivers.filter(d => orders.some(o => o.driver === d.name && o.status === 'Đang vận chuyển')).length,
    idle:    drivers.filter(d => !orders.some(o => o.driver === d.name && o.status === 'Đang vận chuyển')).length,
    orders:  activeOrders.length,
  };

  function clearOrderLayers(orderId: string) {
    const layers = orderLayersRef.current[orderId] || [];
    layers.forEach(l => { try { mapInstanceRef.current?.removeLayer(l); } catch {} });
    delete orderLayersRef.current[orderId];
  }

  function clearAllLayers() {
    Object.keys(orderLayersRef.current).forEach(id => clearOrderLayers(id));
  }

  async function drawAllOrders(allOrders: Order[]) {
    const L = (window as any).L;
    let map = mapInstanceRef.current;
    if (!L || !map) { setGeocoding(false); return; }

    setGeocoding(true);
    try {
      clearAllLayers();

      if (allOrders.length === 0) {
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
        const toCoord   = await geocodeAddress(order.to);

        if (!fromCoord) console.warn('[map] Không tìm tọa độ for:', order.from);
        if (!toCoord)   console.warn('[map] Không tìm tọa độ for:', order.to);

        // Bỏ qua lô hàng nếu không có cả 2 tọa độ
        if (!fromCoord && !toCoord) continue;

        const FC: [number, number] = fromCoord ?? [16.5, 107.0];
        const TC: [number, number] = toCoord   ?? [16.5, 108.0];

        if (fromCoord) allCoords.push(FC);
        if (toCoord)   allCoords.push(TC);

        const routeCoords = await getRoute(FC, TC);

        try {
          if (routeCoords.length >= 2) {
            const routeLine = L.polyline(routeCoords, {
              color: isDelivered ? '#9ca3af' : color,
              weight: isDelivered ? 2 : 3.5,
              opacity: isDelivered ? 0.45 : 0.85,
              dashArray: isDelivered ? '4, 8' : undefined,
            }).addTo(map);
            layers.push(routeLine);
          }

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

          // Luôn hiển thị xe tại điểm xuất phát theo yêu cầu nghiệp vụ hiện tại.
          const truckPos: [number, number] = FC;

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
          const bounds = L.latLngBounds(allCoords.map((c: [number,number]) => L.latLng(c[0], c[1])));
          if (bounds.isValid()) map.fitBounds(bounds, { padding: [48, 48], animate: true, maxZoom: 11 });
        } catch (e) { console.warn('fitBounds error:', e); }
      } else if (map) {
        try { map.setView([16.2, 107.4], 6); } catch {}
      }
    } catch (e) {
      console.warn('[map] drawAllOrders error', e);
    } finally {
      setGeocoding(false);
    }
  }

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

  // Khởi tạo Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Nếu Leaflet đã load (script có sẵn trên window)
    if ((window as any).L) {
      const L = (window as any).L;
      if (mapRef.current && !mapInstanceRef.current) {
        const map = L.map(mapRef.current, { zoomControl: true, attributionControl: true }).setView([16.5, 107.5], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
        mapInstanceRef.current = map;
        setMapReady(true);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = (window as any).L;
      if (!mapRef.current || mapInstanceRef.current) return;
      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: true }).setView([16.5, 107.5], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      mapInstanceRef.current = map;
      setMapReady(true);
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

  // Vẽ lại khi orders hoặc map ready thay đổi
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const toShow = [
      ...orders.filter(o => o.status === 'Đang vận chuyển'),
      ...orders.filter(o => o.status === 'Đã giao'),
    ];
    const t = window.setTimeout(() => { void drawAllOrders(toShow); }, 280);
    return () => window.clearTimeout(t);
  }, [orders, mapReady]);

  return (
    <div className="shipmap-wrap">
      <div className="shipmap-topbar">
        <div className="shipmap-topbar-title">Bản đồ Vận chuyển</div>
        <div className="shipmap-topbar-sub">· Theo dõi lộ trình lô hàng · OpenStreetMap · Nominatim</div>
        <div className="shipmap-topbar-actions">
          <div className="shipmap-chip live"><span className="shipmap-live-dot" />Live</div>
          <div className="shipmap-chip">🔄 Làm mới</div>
          <div className="shipmap-chip">⚙️ Cài đặt</div>
          <div className="shipmap-chip">📤 Xuất</div>
        </div>
      </div>

      <div className="shipmap-content">
        <div className="shipmap-panel">
          <div className="shipmap-panel-header">
            <h2>🚛 Lô hàng vận chuyển</h2>
            <span className="shipmap-count">{activeOrders.length} / {orders.length}</span>
          </div>

          <div className="shipmap-scroll">

            {activeOrders.length === 0 && deliveredOrders.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: '#ccc' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                <div style={{ fontSize: 12 }}>Chưa có lô hàng nào.<br />Tạo lô hàng và gán trạng thái <b>"Đang vận chuyển"</b>.</div>
              </div>
            ) : (
              <>
                {activeOrders.length > 0 && (
                  <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 700, color: '#8c959f', textTransform: 'uppercase', letterSpacing: '.8px' }}>
                    Đang vận chuyển
                  </div>
                )}
                {activeOrders.map((o) => {
                  const isSelected = selectedOrder === o.id;
                  const color = ROUTE_COLORS[orders.filter(x => x.status === 'Đang vận chuyển').indexOf(o) % ROUTE_COLORS.length];
                  return (
                    <div key={o.id}
                      onClick={() => { setSelectedOrder(o.id); focusOrder(o); }}
                      style={{
                        margin: '4px 8px',
                        borderRadius: 8,
                        border: `1px solid ${isSelected ? '#86efac' : '#dde3ec'}`,
                        borderLeft: `3px solid ${isSelected ? color : 'transparent'}`,
                        background: isSelected ? 'rgba(26,127,55,.1)' : '#f0f4f8',
                        padding: '9px 10px',
                        cursor: 'pointer',
                        transition: 'all .15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <b style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#0969da' }}>{o.id}</b>
                        <span style={{ marginLeft: 'auto', fontSize: 9, color: '#1a7f37', background: 'rgba(63,185,80,.2)', borderRadius: 10, padding: '2px 6px', fontWeight: 600 }}>
                          Đang chạy
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, marginBottom: 4 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1a7f37' }} />
                        <span>{o.from}</span>
                        <span style={{ color: '#8c959f' }}>→</span>
                        <span style={{ width: 7, height: 7, borderRadius: 2, background: '#cf222e' }} />
                        <span>{o.to}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#57606a' }}>
                        <span>🚛 {o.driver || '—'}</span>
                        <span>📦 {o.cargo}</span>
                      </div>
                    </div>
                  );
                })}

                {deliveredOrders.length > 0 && (
                  <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 700, color: '#8c959f', textTransform: 'uppercase', letterSpacing: '.8px' }}>
                    Đã giao
                  </div>
                )}
                {deliveredOrders.map(o => {
                  const isSelected = selectedOrder === o.id;
                  return (
                    <div key={o.id}
                      onClick={() => { setSelectedOrder(o.id); focusOrder(o); }}
                      style={{
                        margin: '4px 8px',
                        borderRadius: 8,
                        border: `1px solid ${isSelected ? '#86efac' : '#dde3ec'}`,
                        background: '#f0f4f8',
                        padding: '9px 10px',
                        cursor: 'pointer',
                        opacity: .82,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <b style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#1a7f37' }}>{o.id}</b>
                        <span style={{ marginLeft: 'auto', fontSize: 9, color: '#9a6700', background: 'rgba(188,76,0,.12)', borderRadius: 10, padding: '2px 6px', fontWeight: 600 }}>
                          Đã giao
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#57606a' }}>📍 {o.from} → 🏁 {o.to}</div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div className="shipmap-legend">
            <div className="shipmap-legend-item"><span className="shipmap-route-line" />Lộ trình</div>
            <div className="shipmap-legend-item"><span className="shipmap-dot-green" />Điểm xuất phát</div>
            <div className="shipmap-legend-item"><span className="shipmap-dot-red" />Điểm đến</div>
            <div className="shipmap-legend-item"><span className="shipmap-dot-truck" />Xe đang giao</div>
            <div className="shipmap-legend-item"><span className="shipmap-dot-truck2" />Xe đã giao</div>
          </div>
        </div>

        <div className="shipmap-map">
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
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          <div className="shipmap-overlay">
            <div className="shipmap-overlay-card">
              <div className="lbl">Lô đang chạy</div>
              <div className="val" style={{ color: '#1a7f37' }}>{stats.orders}</div>
            </div>
            <div className="shipmap-overlay-card">
              <div className="lbl">Tài xế online</div>
              <div className="val" style={{ color: '#0969da' }}>{stats.onRoute}</div>
            </div>
            <div className="shipmap-overlay-card">
              <div className="lbl">Chờ xử lý</div>
              <div className="val" style={{ color: '#bc4c00' }}>{orders.filter(o => o.status === 'Chờ xử lý').length}</div>
            </div>
          </div>

          <div className="shipmap-bottom">
            <div className="shipmap-bottom-item">📍 Click vào lô hàng để <b>zoom tới vị trí</b></div>
            <div className="shipmap-bottom-item">🛰 Cập nhật: <b>{new Date().toLocaleTimeString('vi-VN')}</b></div>
            <div className="shipmap-bottom-item">📡 Nguồn bản đồ: <b>OpenStreetMap · Nominatim</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function decodeJwtSub(token: string): string | null {
  try {
    const b64 = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
    if (!b64) return null;
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded)) as { sub?: string };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

function mapGatewayShipmentToOrder(s: Shipment): Order {
  const statusVi: Record<Shipment["status"], string> = {
    CREATED: "Chờ xử lý",
    ASSIGNED: "Chờ xử lý",
    PICKED_UP: "Đã lấy hàng",
    IN_TRANSIT: "Đang vận chuyển",
    DELAYED: "Đang vận chuyển",
    DELIVERED: "Đã giao",
    CANCELLED: "Hủy",
  };
  return {
    id: `LH${String(s.id).padStart(4, "0")}-${s.orderId}`,
    cargo: `Đơn #${s.orderId}`,
    weight: "—",
    qty: "1",
    farm: String(s.farmId),
    from: s.pickupAddress ?? "—",
    to: s.deliveryAddress ?? "—",
    date: s.scheduledDate ?? "",
    time: "",
    driver: s.driverId != null ? `Driver #${s.driverId}` : "—",
    status: statusVi[s.status] ?? "Chờ xử lý",
    note: "",
    createdAt: new Date().toISOString(),
    timeline: []
  };
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

  useSyncOrders(orders);

  const [traceQ, setTraceQ]           = useState('');
  const [traceResult, setTraceResult] = useState<Order | 'not-found' | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceQrLoading, setTraceQrLoading] = useState(false);
  const [traceQrError, setTraceQrError] = useState('');
  const traceInputRef = useRef<HTMLInputElement>(null);
  const traceQrInputRef = useRef<HTMLInputElement>(null);

  const emptyForm = { cargo: '', weight: '', qty: '', farm: '', from: '', to: '', date: '', time: '', driver: '', status: 'Chờ xử lý', note: '', productImage: '' };
  const [form, setForm]       = useState(emptyForm);
  const emptyDriverForm = { name: '', phone: '', plate: '', vehicle: '', cccd: '', image: '' };
  const [drvForm, setDrvForm] = useState(emptyDriverForm);

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

  /** Có JWT unified → tải danh sách shipment từ Gateway `/api/shipping/shipments` (ghi đè local nếu có dữ liệu). */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("bicap_access_token")?.trim() : "";
      if (!token) return;
      const sub = decodeJwtSub(token);
      try {
        const res = await ShippingApi.listShipments({
          userId: sub ?? "shipping-user",
          role: "SHIPPING_MANAGER",
        });
        const rows = res?.data;
        if (cancelled || !Array.isArray(rows) || rows.length === 0) return;
        const next = rows.map(mapGatewayShipmentToOrder);
        setOrders(next);
        localStorage.setItem("agri_orders", JSON.stringify(next));
      } catch {
        /* giữ dữ liệu đã hydrate từ localStorage */
      }
    })();
    return () => {
      cancelled = true;
    };
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

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2200); }

  function doTrace(q = traceQ) {
    if (!q.trim()) return;
    setTraceLoading(true); setTraceResult(null);
    setTimeout(() => {
      const found = orders.find(o => o.id.toUpperCase().includes(q.trim().toUpperCase()));
      setTraceResult(found ?? 'not-found');
      setTraceLoading(false);
    }, 500);
  }

  function extractOrderIdFromQrPayload(raw: string): string | null {
    const value = raw.trim();
    if (!value) return null;
    try {
      const url = new URL(value);
      const idFromQuery = url.searchParams.get('id');
      if (idFromQuery?.trim()) return idFromQuery.trim();
      const parts = url.pathname.split('/').filter(Boolean);
      const idFromPath = parts.at(-1);
      if (idFromPath && /LH\d{4}/i.test(idFromPath)) return idFromPath;
    } catch {
      // Không phải URL => thử parse trực tiếp
    }
    const idMatch = value.match(/LH\d{4}(?:-[A-Z0-9]+)?/i);
    if (idMatch?.[0]) return idMatch[0].toUpperCase();
    return value;
  }

  async function handleTraceQrUpload(file: File) {
    setTraceQrError('');
    setTraceQrLoading(true);
    try {
      const imageUrl = URL.createObjectURL(file);
      try {
        const img = new Image();
        img.src = imageUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Không mở được ảnh QR.'));
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Không khởi tạo được bộ đọc ảnh.');
        ctx.drawImage(img, 0, 0);
        let rawValue = '';

        const BarcodeDetectorCtor = (window as any).BarcodeDetector;
        if (BarcodeDetectorCtor) {
          try {
            const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
            const codes = await detector.detect(canvas);
            rawValue = codes?.[0]?.rawValue ?? '';
          } catch {
            // fallback bên dưới
          }
        }

        if (!rawValue) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });
          rawValue = decoded?.data ?? '';
        }

        if (!rawValue) throw new Error('Không tìm thấy QR trong ảnh. Hãy thử ảnh rõ hơn.');
        const orderId = extractOrderIdFromQrPayload(rawValue);
        if (!orderId) throw new Error('QR không chứa mã lô hợp lệ.');
        setTraceQ(orderId);
        doTrace(orderId);
        showToast('✅ Đã đọc QR, đang tra cứu: ' + orderId);
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đọc ảnh QR thất bại.';
      setTraceQrError(msg);
    } finally {
      setTraceQrLoading(false);
    }
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
    transit: orders.filter(o => o.status === 'Đã lấy hàng' || o.status === 'Đang vận chuyển').length,
    wait:    orders.filter(o => o.status === 'Chờ xử lý').length,
    done:    orders.filter(o => o.status === 'Đã giao').length,
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (o.id + o.cargo + o.driver + o.from + o.to).toLowerCase().includes(q) && (!filterS || o.status === filterS);
  }).slice().reverse();

  function changeStatus(id: string, val: string) {
    const statusDesc: Record<string, string> = {
      'Chờ xử lý': 'Đang chờ tài xế nhận đơn',
      'Đã lấy hàng': 'Tài xế đã nhận hàng từ điểm xuất phát',
      'Đang vận chuyển': 'Hàng đang trên đường giao',
      'Đã giao': 'Hàng đã giao thành công',
      'Hủy': 'Đơn giao hàng đã hủy',
    };
    const next = orders.map(o => o.id === id
      ? { ...o, status: val, timeline: [...(o.timeline || []), { time: new Date().toLocaleString('vi-VN'), label: val, desc: statusDesc[val] ?? 'Cập nhật trạng thái' }] }
      : o);
    saveO(next);
    if (detail?.id === id) setDetail(next.find(o => o.id === id) ?? null);
  }

  function submitOrder() {
    if (!form.cargo || !form.from || !form.to) { alert('Vui lòng điền: Hàng hóa, Điểm đi, Điểm đến.'); return; }
    const selectedDriver = drivers.find((d) => d.name === form.driver);
    const order: Order = {
      ...form, id: genId(orders), createdAt: new Date().toLocaleDateString('vi-VN'),
      driverPhone: selectedDriver?.phone || '',
      driverPlate: selectedDriver?.plate || '',
      driverVehicle: selectedDriver?.vehicle || '',
      timeline: [{ time: new Date().toLocaleString('vi-VN'), label: 'Đã tạo lô hàng', desc: 'Lô hàng vừa được tạo' }],
    };
    saveO([...orders, order]);
    setForm(emptyForm);
    showToast('✅ Tạo thành công! Mã: ' + order.id);
    navigate('orders');
  }

  async function handleProductImageUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      showToast('⚠️ Vui lòng chọn file ảnh.');
      return;
    }
    const toDataUrl = (blob: Blob) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Không đọc được file ảnh.'));
        reader.readAsDataURL(blob);
      });
    try {
      // Resize nhẹ để tránh lưu localStorage quá nặng.
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = imageUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Không xử lý được ảnh.'));
      });
      const maxW = 720;
      const scale = Math.min(1, maxW / (img.naturalWidth || img.width || maxW));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
      canvas.height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Không tạo được vùng xử lý ảnh.');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.84));
      URL.revokeObjectURL(imageUrl);
      const dataUrl = blob ? await toDataUrl(blob) : await toDataUrl(file);
      setForm(f => ({ ...f, productImage: dataUrl }));
      showToast('✅ Đã thêm ảnh sản phẩm.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tải ảnh thất bại.';
      showToast('⚠️ ' + msg);
    }
  }

  async function handleDriverImageUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      showToast('⚠️ Vui lòng chọn file ảnh tài xế.');
      return;
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Không đọc được ảnh tài xế.'));
        reader.readAsDataURL(file);
      });
      setDrvForm(d => ({ ...d, image: dataUrl }));
      showToast('✅ Đã tải ảnh tài xế.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không tải được ảnh tài xế.';
      showToast('⚠️ ' + msg);
    }
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
    setDrvForm(emptyDriverForm);
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

  const NAV = [
    { id: 'dashboard' as Page, label: 'Tổng quan' },
    { id: 'orders'    as Page, label: 'Lô hàng' },
    { id: 'drivers'   as Page, label: 'Tài xế' },
    { id: 'map'       as Page, label: 'Bản đồ' },
    { id: 'new-order' as Page, label: 'Tạo lô hàng' },
  ];

  return (
    <div style={S.body}>
      <main style={S.main}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 80, background: 'rgba(255,255,255,.92)', borderBottom: '1px solid #e2e8f0',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 6, paddingRight: 8 }}>
            <div style={{ ...S.logoIcon, width: 34, height: 34, fontSize: 11, fontWeight: 700, color: '#fff', boxShadow: '0 8px 18px rgba(22,163,74,.28)' }}>AC</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>AgriChain</div>
              <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '.3px' }}>Vận chuyển</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 520, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 4 }}>
              {NAV.map(item => {
                const active = page === item.id;
                const hover = navHover === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    onMouseEnter={() => setNavHover(item.id)}
                    onMouseLeave={() => setNavHover('')}
                    style={{
                      border: `1px solid ${active ? '#c8d4e6' : 'transparent'}`,
                      background: active ? '#ffffff' : hover ? '#ffffff' : 'transparent',
                      color: active ? '#0f172a' : '#475569',
                      borderRadius: 10,
                      padding: '8px 11px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      flex: 1,
                      minWidth: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>{item.label}</span>
                    {item.id === 'orders' && orders.length > 0 && (
                      <span style={{ background: '#0f172a', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>{orders.length}</span>
                    )}
                    {item.id === 'map' && drivers.length > 0 && (
                      <span style={{ background: '#3b82f6', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>{drivers.length}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => navigate('trace')}
              onMouseEnter={() => setNavHover('trace')}
              onMouseLeave={() => setNavHover('')}
              style={{
                border: `1px solid ${page === 'trace' ? '#6ee7b7' : '#bbf7d0'}`,
                background: page === 'trace' ? '#ecfdf5' : '#f7fff8',
                color: '#047857',
                borderRadius: 999,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700 }}>QR</span>
              <span>Tra cứu QR</span>
              <span style={{ background: '#059669', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99 }}>PUBLIC</span>
            </button>
          </div>
        </div>
        <div key={animKey} className="page-enter" style={{ padding: page === 'map' ? '14px 16px' : '24px 24px', minHeight: '100vh' }}>

          {/* ── DASHBOARD ── */}
          {page === 'dashboard' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Tổng quan</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{dateStr}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-press" onClick={() => navigate('map')} style={{ ...S.btn, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: 12 }}>Xem bản đồ</button>
                  <button className="btn-press" onClick={exportCSV} style={{ ...S.btn, background: '#f8fafc', color: '#334155', border: '1px solid #dbe3ee', fontSize: 12 }}>Xuất CSV</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
                {[
                  { label: 'Tổng lô hàng',   value: stats.total,   color: '#0f172a',    sub: 'Tất cả lô' },
                  { label: 'Đang vận chuyển', value: stats.transit, color: '#1d4ed8', sub: 'Đang đi' },
                  { label: 'Chờ xử lý',       value: stats.wait,    color: '#854d0e', sub: 'Chưa giao' },
                  { label: 'Đã hoàn thành',   value: stats.done,    color: '#15803d', sub: 'Thành công' },
                ].map(s => (
                  <div key={s.label} className="stat-card" style={{ ...S.statCard, minWidth: 170 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.45px', fontWeight: 700 }}>{s.label}</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Map banner */}
              <div style={{ background: 'linear-gradient(135deg,#f5f9ff,#eaf2ff)', border: '1px solid #d7e6ff', borderRadius: 16, padding: '16px 20px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', boxShadow: '0 8px 20px rgba(59,130,246,.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#dbeafe', color: '#1d4ed8', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center' }}>MAP</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1e3a8a' }}>Bản đồ theo dõi tài xế</div>
                    <div style={{ fontSize: 12, color: '#1d4ed8', marginTop: 2 }}>
                      {drivers.length > 0 ? `${drivers.length} tài xế · ${stats.transit} lô đang vận chuyển` : 'Thêm tài xế để theo dõi trên bản đồ'}
                    </div>
                  </div>
                </div>
                <button className="btn-press" onClick={() => navigate('map')} style={{ ...S.btn, background: '#1d4ed8', color: '#fff', whiteSpace: 'nowrap' }}>Mở bản đồ →</button>
              </div>

              {/* Quick trace banner */}
              <div style={{ background: 'linear-gradient(135deg,#f6fff8,#e8fbee)', border: '1px solid #c7f2d3', borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', boxShadow: '0 8px 20px rgba(22,163,74,.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center' }}>QR</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#14532d' }}>Tra cứu nguồn gốc lô hàng</div>
                    <div style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>Khách hàng có thể tra cứu minh bạch hành trình nông sản</div>
                  </div>
                </div>
                <button className="btn-press" onClick={() => navigate('trace')} style={{ ...S.btn, background: '#16a34a', color: '#fff', whiteSpace: 'nowrap' }}>Mở trang tra cứu →</button>
              </div>

              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 18px', borderBottom: '1px solid #edf2f7' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Lô hàng gần đây</span>
                  <button onClick={() => navigate('orders')} style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Xem tất cả →</button>
                </div>
                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '34px 20px', color: '#ccc' }}>
                    <div style={{ fontSize: 13, marginBottom: 10, fontWeight: 700, color: '#94a3b8' }}>EMPTY</div>
                    <p>Chưa có lô hàng nào.</p>
                    <button onClick={() => navigate('new-order')} style={{ marginTop: 10, background: 'none', border: 'none', color: '#16a34a', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Tạo lô hàng đầu tiên →</button>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                    <thead><tr>{['Mã lô', 'Hàng hóa', 'Điểm đi → Điểm đến', 'Tài xế', 'Trạng thái', ''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {orders.slice().reverse().slice(0, 6).map(o => (
                        <tr key={o.id} className="trow" onClick={() => setDetail(o)}>
                          <td style={S.td}><b style={{ color: '#15803d', fontFamily: 'monospace', fontSize: 12 }}>{o.id}</b></td>
                          <td style={S.td}>{o.cargo}</td>
                          <td style={{ ...S.td, color: '#888' }}>{o.from} → {o.to}</td>
                          <td style={{ ...S.td, color: '#888' }}>{o.driver || '—'}</td>
                          <td style={S.td}><StatusBadge status={o.status} /></td>
                          <td style={S.td} onClick={e => e.stopPropagation()}>
                            <button onClick={() => traceOrder(o.id)} style={{ ...S.btn, padding: '4px 10px', fontSize: 11, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>Tra cứu</button>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Quản lý Lô hàng</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>Tất cả lô hàng vận chuyển</div>
                </div>
                <button className="btn-press" onClick={exportCSV} style={{ ...S.btn, background: '#f8fafc', color: '#334155', border: '1px solid #dbe3ee', fontSize: 12 }}>Xuất CSV</button>
              </div>
              <div style={S.card}>
                <div style={{ display: 'flex', gap: 10, padding: '14px 16px', borderBottom: '1px solid #edf2f7', flexWrap: 'wrap', background: '#fbfdff' }}>
                  <input style={{ ...S.inp, flex: 1, minWidth: 180 } as CSSProperties} placeholder="Tìm mã lô, hàng hóa, tài xế..." value={search} onChange={e => setSearch(e.target.value)} />
                  <select style={{ ...S.inp, width: 180 } as CSSProperties} value={filterS} onChange={e => setFilterS(e.target.value)}>
                    <option value="">Tất cả trạng thái</option>
                    {['Chờ xử lý', 'Đã lấy hàng', 'Đang vận chuyển', 'Đã giao', 'Hủy'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                {filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '34px', color: '#ccc' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>EMPTY</div><p>Không có lô hàng nào.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
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
                                <select style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #dbe2ea', borderRadius: 8, background: '#fff', cursor: 'pointer', outline: 'none' }}
                                  defaultValue="" onChange={e => { changeStatus(o.id, e.target.value); (e.target as HTMLSelectElement).value = ''; }}>
                                  <option value="" disabled>Cập nhật</option>
                                  {['Chờ xử lý', 'Đã lấy hàng', 'Đang vận chuyển', 'Đã giao', 'Hủy'].map(s => <option key={s}>{s}</option>)}
                                </select>
                                <button title="Tra cứu" onClick={() => traceOrder(o.id)} style={{ ...S.btn, padding: '4px 8px', fontSize: 12, background: '#f7fff8', color: '#15803d', border: '1px solid #bbf7d0' }}>Tra cứu</button>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Tài xế</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>Quản lý danh sách tài xế · {drivers.length} người</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-press" onClick={() => navigate('map')} style={{ ...S.btn, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: 12 }}>Xem bản đồ</button>
                  <button className="btn-press" onClick={() => { setDrvForm(emptyDriverForm); setEditDriver(null); setShowDrv(true); }} style={{ ...S.btn, background: '#16a34a', color: '#fff' }}>+ Thêm tài xế</button>
                </div>
              </div>
              <div style={S.card}>
                {drivers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '34px', color: '#ccc' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>EMPTY</div><p>Chưa có tài xế nào.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                    <thead><tr>{['Tài xế', 'Điện thoại', 'CCCD', 'Biển số', 'Loại xe', 'Lô đang giao', ''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {drivers.map((d, i) => {
                        const cnt = orders.filter(o => o.driver === d.name && o.status === 'Đang vận chuyển').length;
                        return (
                          <tr key={i} className="trow" style={{ cursor: 'default' }}>
                            <td style={S.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {d.image ? (
                                  <img src={d.image} alt={d.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1px solid #dbe2ea' }} />
                                ) : (
                                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                                    {(d.name || '?').slice(0, 1).toUpperCase()}
                                  </div>
                                )}
                                <b>{d.name}</b>
                              </div>
                            </td>
                            <td style={{ ...S.td, color: '#888' }}>{d.phone || '—'}</td>
                            <td style={{ ...S.td, color: '#888', fontFamily: 'monospace', fontSize: 12 }}>{d.cccd || '—'}</td>
                            <td style={{ ...S.td, color: '#888' }}>{d.plate || '—'}</td>
                            <td style={{ ...S.td, color: '#888' }}>{d.vehicle || '—'}</td>
                            <td style={S.td}>
                              {cnt > 0
                                ? <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{cnt} lô</span>
                                : <span style={{ color: '#bbb', fontSize: 12 }}>Rảnh</span>}
                            </td>
                            <td style={S.td}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  className="btn-press"
                                  onClick={() => {
                                    setDrvForm({
                                      name: d.name || '',
                                      phone: d.phone || '',
                                      plate: d.plate || '',
                                      vehicle: d.vehicle || '',
                                      cccd: d.cccd || '',
                                      image: d.image || '',
                                    });
                                    setEditDriver({ idx: i, data: d });
                                    setShowDrv(true);
                                  }}
                                  style={{ ...S.btn, padding: '4px 10px', fontSize: 12, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
                                >
                                  Sửa
                                </button>
                                <button className="btn-press" onClick={() => { if (confirm('Xóa tài xế này?')) saveD(drivers.filter((_, j) => j !== i)); }} style={{ ...S.btn, padding: '4px 10px', fontSize: 12, background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>Xóa</button>
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
          {page === 'map' && <MapPage drivers={drivers} orders={orders} />}

          {/* ── NEW ORDER ── */}
          {page === 'new-order' && (
            <div style={{ maxWidth: 680 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Tạo Lô hàng mới</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>Điền thông tin để tạo chuyến hàng</div>
              <div style={{ ...S.card, padding: 24, boxShadow: '0 12px 30px rgba(15,23,42,.06)' }}>
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
                    <textarea style={{ ...S.inp, minHeight: 84, resize: 'vertical' } as CSSProperties}
                      placeholder="Hàng dễ vỡ, cần bảo quản lạnh..."
                      value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>Ảnh sản phẩm (cho web public)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <label style={{ ...S.btn, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        🖼 Tải ảnh
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const inputEl = e.target as HTMLInputElement;
                            const file = e.target.files?.[0];
                            if (file) await handleProductImageUpload(file);
                            inputEl.value = '';
                          }}
                        />
                      </label>
                      {form.productImage && (
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, productImage: '' }))}
                          style={{ ...S.btn, background: '#fff', color: '#b91c1c', border: '1px solid #fecaca', padding: '8px 12px' }}
                        >
                          Xóa ảnh
                        </button>
                      )}
                    </div>
                    {form.productImage && (
                      <div style={{ marginTop: 10 }}>
                        <img
                          src={form.productImage}
                          alt="Ảnh sản phẩm preview"
                          style={{ width: 150, height: 100, objectFit: 'cover', borderRadius: 10, border: '1px solid #e5e7eb' }}
                        />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                    <button onClick={() => setForm(emptyForm)} style={{ ...S.btn, background: '#fff', color: '#475569', border: '1px solid #dbe2ea' }}>Xóa form</button>
                    <button className="btn-press" onClick={submitOrder} style={{ ...S.btn, background: '#16a34a', color: '#fff' }}>Tạo lô hàng</button>
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

              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #dbe2ea', boxShadow: '0 10px 26px rgba(15,23,42,.05)', padding: '20px 22px', marginBottom: 20 }}>
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
                <input
                  ref={traceQrInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const inputEl = e.target as HTMLInputElement;
                    const file = e.target.files?.[0];
                    if (file) await handleTraceQrUpload(file);
                    inputEl.value = '';
                  }}
                />
                <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => traceQrInputRef.current?.click()}
                    disabled={traceQrLoading}
                    style={{
                      ...S.btn,
                      background: traceQrLoading ? '#d1d5db' : '#eff6ff',
                      color: traceQrLoading ? '#fff' : '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      padding: '8px 14px',
                      fontSize: 12,
                    }}
                  >
                    {traceQrLoading ? '⏳ Đang đọc ảnh QR...' : '🖼 Tải ảnh QR để tra cứu'}
                  </button>
                  <span style={{ fontSize: 11, color: '#9ca3af', alignSelf: 'center' }}>
                    Hỗ trợ ảnh chụp QR từ điện thoại (.png, .jpg, .webp)
                  </span>
                </div>
                {traceQrError && (
                  <div style={{ marginBottom: 10, fontSize: 12, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 10px' }}>
                    ⚠️ {traceQrError}
                  </div>
                )}
                <button className="btn-press" onClick={() => doTrace()} disabled={traceLoading || !traceQ.trim()} style={{
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
                        <div style={{ flex: 1, height: 2, background: 'linear-gradient(90deg,#86efac,#16a34a)', opacity: o.status === 'Đã giao' ? 1 : 0.25 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 100, textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Điểm đến</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginTop: 3 }}>🏁 {o.to}</div>
                      </div>
                    </div>
                    {timeline.length > 0 && (
                      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 22px', marginBottom: 16 }}>
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
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Chi tiết Lô hàng</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Xem và cập nhật thông tin đơn vận chuyển</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setDetail(null); traceOrder(detail.id); }} style={{ ...S.btn, padding: '5px 12px', fontSize: 12, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>🔍 Tra cứu</button>
                <button onClick={() => copyId(detail.id)} style={{ ...S.btn, padding: '5px 12px', fontSize: 12, background: '#f9fafb', color: '#475569', border: '1px solid #dbe2ea' }}>📋 Copy mã</button>
              </div>
            </div>
            {([
              ['Mã lô hàng', detail.id], ['Hàng hóa', detail.cargo],
              ['Trọng lượng', detail.weight ? detail.weight + ' kg' : '—'], ['Số kiện', detail.qty || '—'],
              ['Nông trại', detail.farm || '—'], ['Điểm xuất phát', detail.from], ['Điểm đến', detail.to],
              ['Tài xế', detail.driver || '—'], ['Ngày giao', (detail.date || '—') + ' ' + (detail.time || '')],
              ['Ghi chú', detail.note || '—'],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', padding: '9px 0', borderBottom: '1px solid #eef2f7', fontSize: 13 }}>
                <span style={{ color: '#64748b', width: 150, flexShrink: 0 }}>{k}</span>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', padding: '9px 0', borderBottom: '1px solid #eef2f7', fontSize: 13 }}>
              <span style={{ color: '#64748b', width: 150, flexShrink: 0 }}>Trạng thái</span>
              <StatusBadge status={detail.status} />
            </div>
            <div style={{ margin: '14px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#888', flexShrink: 0 }}>Cập nhật trạng thái:</span>
              <select style={{ ...S.inp, flex: 1, fontSize: 13 } as CSSProperties} value={detail.status}
                onChange={e => changeStatus(detail.id, e.target.value)}>
                {['Chờ xử lý', 'Đã lấy hàng', 'Đang vận chuyển', 'Đã giao', 'Hủy'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginTop: 18, fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#0f172a' }}>📋 Lịch sử vận chuyển</div>
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
            {/* QR Code */}
            <div style={{ marginTop: 20, padding: '18px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flexShrink: 0, background: '#fff', padding: 10, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
                <QRCodeCanvas
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/trace?id=${detail.id}`}
                  size={110} level="M" includeMargin={false} id={`qr-${detail.id}`}
                />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#14532d', marginBottom: 4 }}>🔲 QR Code lô hàng</div>
                <div style={{ fontSize: 12, color: '#15803d', marginBottom: 10, lineHeight: 1.5 }}>
                  Dán QR này lên kiện hàng. Khách hàng quét để tra cứu hành trình vận chuyển.
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#065f46', background: '#dcfce7', padding: '4px 10px', borderRadius: 6, display: 'inline-block', marginBottom: 12 }}>{detail.id}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn-press" onClick={() => {
                    const canvas = document.getElementById(`qr-${detail.id}`) as HTMLCanvasElement;
                    if (!canvas) return;
                    const a = document.createElement('a');
                    a.href = canvas.toDataURL('image/png');
                    a.download = `QR-${detail.id}.png`;
                    a.click();
                    showToast('✅ Đã tải QR: ' + detail.id);
                  }} style={{ ...S.btn, padding: '7px 14px', fontSize: 12, background: '#16a34a', color: '#fff' }}>⬇ Tải QR (.png)</button>
                  <button className="btn-press" onClick={() => {
                    const canvas = document.getElementById(`qr-${detail.id}`) as HTMLCanvasElement;
                    const printWin = window.open('', '_blank');
                    if (!printWin || !canvas) return;
                    printWin.document.write(`<html><head><title>QR - ${detail.id}</title>
                      <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff;}
                      .wrap{text-align:center;padding:32px;border:2px dashed #16a34a;border-radius:16px;}
                      h2{color:#14532d;margin:0 0 4px;font-size:18px;}p{color:#6b7280;font-size:12px;margin:0 0 16px;}
                      .id{font-family:monospace;font-size:15px;font-weight:700;color:#065f46;background:#dcfce7;padding:6px 14px;border-radius:8px;display:inline-block;margin-top:14px;}</style></head>
                      <body><div class="wrap"><h2>AgriChain Shipping</h2><p>Quét mã QR để tra cứu hành trình lô hàng</p>
                      <img src="${canvas.toDataURL()}" width="160" height="160"/><div class="id">${detail.id}</div></div></body></html>`);
                    printWin.document.close();
                    setTimeout(() => printWin.print(), 400);
                  }} style={{ ...S.btn, padding: '7px 14px', fontSize: 12, background: '#fff', color: '#16a34a', border: '1px solid #bbf7d0' }}>🖨 In QR</button>
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
          <div style={{ ...S.modal, width: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 18, color: '#0f172a' }}>{editDriver ? 'Sửa Tài xế' : 'Thêm Tài xế'}</div>
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
                  <label style={S.label}>Số căn cước</label>
                  <input style={S.inp as CSSProperties} placeholder="0792xxxxxxxx" value={drvForm.cccd || ''} onChange={e => setDrvForm(d => ({ ...d, cccd: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>Biển số xe</label>
                  <input style={S.inp as CSSProperties} placeholder="51F-12345" value={drvForm.plate} onChange={e => setDrvForm(d => ({ ...d, plate: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>Loại xe</label>
                  <select style={S.inp as CSSProperties} value={drvForm.vehicle} onChange={e => setDrvForm(d => ({ ...d, vehicle: e.target.value }))}>
                    <option value="">-- Chọn loại xe --</option>
                    <option>Xe tải</option><option>Xe tải lạnh</option><option>Xe van</option><option>Xe máy</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={S.label}>Ảnh tài xế</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <label style={{ ...S.btn, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px' }}>
                    🖼 Tải ảnh
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const inputEl = e.target as HTMLInputElement;
                        const file = e.target.files?.[0];
                        if (file) await handleDriverImageUpload(file);
                        inputEl.value = '';
                      }}
                    />
                  </label>
                  {drvForm.image && (
                    <button
                      type="button"
                      onClick={() => setDrvForm(d => ({ ...d, image: '' }))}
                      style={{ ...S.btn, background: '#fff', color: '#b91c1c', border: '1px solid #fecaca', padding: '8px 12px' }}
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
                {drvForm.image && (
                  <div style={{ marginTop: 10 }}>
                    <img
                      src={drvForm.image}
                      alt="Ảnh tài xế preview"
                      style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: '50%', border: '1px solid #dbe2ea' }}
                    />
                  </div>
                )}
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