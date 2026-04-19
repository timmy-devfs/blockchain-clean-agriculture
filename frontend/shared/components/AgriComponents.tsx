'use client';
// ═══════════════════════════════════════════════
// AgriChain — Shared React Components
// Copy file này vào mỗi package: src/components/agrichain/
// ═══════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { KAFKA_TOPICS, KAFKA_MESSAGES } from '../data';

// ── TYPES ──────────────────────────────────────
export interface Service  { name: string; port: number; status: 'up'|'warn'|'down'; ping: number|null; }
export interface Driver   { name: string; code: string; color: string; route: string; pct: number; status: string; cargo: string; }
export interface IoTSensor{ label: string; value: string; unit: string; pct: number; cls: string; trend: string; delta: string; }
export interface TxRow    { hash: string; farm: string; type: string; cls: string; }

// ── METRIC CARD ────────────────────────────────
interface MetricCardProps {
  label: string; value: string | number; delta: string;
  deltaType?: 'up'|'down'|'neutral'; glyph?: string; color?: string;
  id?: string;
}
export function MetricCard({ label, value, delta, deltaType = 'neutral', glyph, color = 'mc-green', id }: MetricCardProps) {
  const deltaClass = deltaType === 'up' ? 'md-up' : deltaType === 'down' ? 'md-down' : 'md-neutral';
  return (
    <div className={`metric-card ${color}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value" id={id}>{value}</div>
      <div className={`metric-delta ${deltaClass}`}>{delta}</div>
      {glyph && <div className="metric-glyph">{glyph}</div>}
    </div>
  );
}

// ── SERVICE HEALTH LIST ────────────────────────
export function ServiceList({ services }: { services: Service[] }) {
  const dotCls = (s: string) => s === 'up' ? 'sd-up' : s === 'warn' ? 'sd-warn' : 'sd-down';
  const pingCls = (s: string) => s === 'up' ? 'sp-ok' : s === 'warn' ? 'sp-warn' : 'sp-down';
  return (
    <div className="svc-list">
      {services.map((svc) => (
        <div className="svc-item" key={svc.name}>
          <div className={`svc-dot ${dotCls(svc.status)}`}></div>
          <span className="svc-name">{svc.name}</span>
          <span className="svc-port">:{svc.port}</span>
          <span className={`svc-ping ${pingCls(svc.status)}`}>{svc.ping ? `${svc.ping}ms` : '—'}</span>
        </div>
      ))}
    </div>
  );
}

// ── LIVE SERVICE LIST (auto-jitter ping) ────────
export function LiveServiceList({ services: initialServices }: { services: Service[] }) {
  const [services, setServices] = useState(initialServices);
  useEffect(() => {
    const interval = setInterval(() => {
      setServices(prev => prev.map(s =>
        s.status === 'up' && s.ping
          ? { ...s, ping: Math.max(5, s.ping + Math.floor((Math.random() - 0.5) * 12)) }
          : s
      ));
    }, 2800);
    return () => clearInterval(interval);
  }, []);
  return <ServiceList services={services} />;
}

// ── DRIVER LIST ────────────────────────────────
export function DriverList({ drivers: initialDrivers }: { drivers: Driver[] }) {
  const [drivers, setDrivers] = useState(initialDrivers);
  useEffect(() => {
    const interval = setInterval(() => {
      setDrivers(prev => prev.map(d =>
        d.pct < 98 ? { ...d, pct: Math.min(98, d.pct + (Math.random() < 0.3 ? 1 : 0)) } : d
      ));
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="driver-list">
      {drivers.map((d) => (
        <div className="driver-item on-route" key={d.name}>
          <div className="driver-head">
            <div className={`driver-avatar ${d.color}`}>{d.code}</div>
            <span className="driver-name">{d.name}</span>
            <span className="badge b-pending" style={{ fontSize: '10px' }}>{d.status}</span>
          </div>
          <div className="driver-route">
            <div className="route-dot"></div> {d.route}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>
            Hàng: {d.cargo}
          </div>
          <div className="driver-bar">
            <div className="d-progress">
              <div className="dp-fill" style={{ width: `${d.pct}%`, background: d.pct > 85 ? 'var(--green)' : 'var(--amber)' }}></div>
            </div>
            <span className="driver-pct" style={{ color: d.pct > 85 ? 'var(--green)' : 'var(--amber)' }}>{d.pct}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── IOT GRID ───────────────────────────────────
export function IoTGrid({ sensors }: { sensors: IoTSensor[] }) {
  return (
    <div className="iot-grid">
      {sensors.map((s) => (
        <div className="iot-sensor" key={s.label}>
          <div className="iot-label">{s.label}</div>
          <div className="iot-value">{s.value}<span className="iot-unit">{s.unit}</span></div>
          <div className={`iot-trend ${s.trend}`} style={{ fontSize: '10px' }}>{s.delta}</div>
          <div className="iot-bar"><div className={`ib-fill ${s.cls}`} style={{ width: `${s.pct}%` }}></div></div>
        </div>
      ))}
    </div>
  );
}

// ── TX TABLE ───────────────────────────────────
export function TxTable({ rows }: { rows: TxRow[] }) {
  return (
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr><th>TX Hash</th><th>Farm</th><th>Loại</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.hash}>
              <td><span className="hash">{t.hash}</span></td>
              <td>{t.farm}</td>
              <td><span className={`badge ${t.cls}`}>{t.type}</span></td>
              <td><span className="badge b-ok">● Confirmed</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── KAFKA STREAM ───────────────────────────────
interface KafkaEvent { topic: string; msg: string; time: string; }
export function KafkaStream({ maxItems = 8, style }: { maxItems?: number; style?: React.CSSProperties }) {
  const [events, setEvents] = useState<KafkaEvent[]>([]);
  const addEvent = () => {
    const i = Math.floor(Math.random() * KAFKA_TOPICS.length);
    const now = new Date();
    const t = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
    setEvents(prev => [{ topic: KAFKA_TOPICS[i], msg: KAFKA_MESSAGES[i], time: t }, ...prev].slice(0, maxItems));
  };
  useEffect(() => {
    for (let i = 0; i < Math.min(4, maxItems); i++) {
      setTimeout(addEvent, i * 100);
    }
    const interval = setInterval(addEvent, 2800);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="kafka-stream" style={style}>
      {events.map((ev, idx) => (
        <div className="kafka-event" key={`${ev.topic}-${ev.time}-${idx}`}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ke-topic">{ev.topic}</div>
            <div className="ke-msg">{ev.msg}</div>
          </div>
          <div className="ke-time">{ev.time}</div>
        </div>
      ))}
    </div>
  );
}

// ── CHAIN PROGRESS WIDGET ──────────────────────
const CHAIN_STEPS = [
  { label: 'Gieo trồng',  state: 'done'   },
  { label: 'Chăm sóc',    state: 'done'   },
  { label: 'Thu hoạch',   state: 'done'   },
  { label: 'Vận chuyển',  state: 'active' },
  { label: 'Phân phối',   state: 'idle'   },
];
export function ChainProgress() {
  return (
    <div className="chain-progress">
      <div className="chain-title">CHUỖI CUNG ỨNG — LÔ #B2024-0418</div>
      <div className="chain-steps">
        {CHAIN_STEPS.map((step, i) => (
          <div key={step.label}>
            {i > 0 && <div className="cs-line"></div>}
            <div className="chain-step">
              <div className={`cs-dot ${step.state === 'done' ? 'cs-done' : step.state === 'active' ? 'cs-active' : 'cs-idle'}`}>
                {step.state === 'done' ? '✓' : step.state === 'active' ? '→' : '○'}
              </div>
              <span style={step.state === 'active' ? { color: 'var(--amber)' } : step.state === 'idle' ? { color: 'var(--text4)' } : {}}>
                {step.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── LIVE PILL ─────────────────────────────────
export function LivePill({ label = 'Live' }: { label?: string }) {
  return (
    <div className="live-pill">
      <div className="live-dot"></div> {label}
    </div>
  );
}

// ── API TRAFFIC CHART (SVG) ────────────────────
export function ApiTrafficChart() {
  return (
    <div>
      <div className="card-head">
        <div>
          <div className="card-title">Lưu lượng API Gateway</div>
          <div className="card-sub">Port :8080 — 7 ngày gần nhất</div>
        </div>
        <div className="tab-row">
          <button className="tab on">7n</button>
          <button className="tab">30n</button>
          <button className="tab">90n</button>
        </div>
      </div>
      <svg className="chart-svg" viewBox="0 0 480 130" height={130}>
        <defs>
          <linearGradient id="gfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.22"/>
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <line x1="0" y1="30"  x2="480" y2="30"  stroke="rgba(34,197,94,.06)" strokeWidth="1"/>
        <line x1="0" y1="65"  x2="480" y2="65"  stroke="rgba(34,197,94,.06)" strokeWidth="1"/>
        <line x1="0" y1="100" x2="480" y2="100" stroke="rgba(34,197,94,.06)" strokeWidth="1"/>
        <text x="4" y="28"  fontSize="9" fill="#3A5C40">10k</text>
        <text x="4" y="63"  fontSize="9" fill="#3A5C40">5k</text>
        <text x="4" y="98"  fontSize="9" fill="#3A5C40">1k</text>
        <path d="M30,100 L100,75 L170,55 L240,70 L310,28 L380,42 L450,18"
              fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M30,100 L100,75 L170,55 L240,70 L310,28 L380,42 L450,18 L450,130 L30,130Z"
              fill="url(#gfill)"/>
        <circle cx="310" cy="28" r="4" fill="#22C55E"/>
        <circle cx="310" cy="28" r="7" fill="rgba(34,197,94,.2)"/>
        <circle cx="450" cy="18" r="4" fill="#22C55E"/>
      </svg>
      <div className="chart-x">
        {['T2','T3','T4','T5','T6','T7','CN'].map(d => (
          <span key={d} className="cx-lbl">{d}</span>
        ))}
      </div>
    </div>
  );
}

// ── SUPPLY CHAIN FLOW ──────────────────────────
export function SupplyChainFlow() {
  return (
    <div className="scflow">
      <div className="scf-stage done">
        <div className="scf-icon si-green">🌱</div>
        <div className="scf-info">
          <div className="scf-name">Gieo trồng</div>
          <div className="scf-meta">128 trang trại đăng ký</div>
        </div>
        <div className="scf-right">
          <div className="scf-count">1,240</div>
          <div className="scf-pct">lô đã ghi nhận</div>
        </div>
      </div>
      <div className="scf-stage done">
        <div className="scf-icon si-green">🌿</div>
        <div className="scf-info">
          <div className="scf-name">Chăm sóc & Thu hoạch</div>
          <div className="scf-meta">Ghi nhận IoT + blockchain</div>
        </div>
        <div className="scf-right">
          <div className="scf-count">1,198</div>
          <div className="scf-pct">96.6%</div>
        </div>
      </div>
      <div className="scf-stage active-stage">
        <div className="scf-icon si-amber">🚚</div>
        <div className="scf-info">
          <div className="scf-name">Vận chuyển</div>
          <div className="scf-meta">6 tài xế đang giao — GPS live</div>
          <div className="progress-bar" style={{ marginTop: '5px' }}>
            <div className="progress-fill pf-amber" style={{ width: '72%' }}></div>
          </div>
        </div>
        <div className="scf-right">
          <div className="scf-count" style={{ color: 'var(--amber)' }}>347</div>
          <div className="scf-pct">72% đúng hạn</div>
        </div>
      </div>
      <div className="scf-stage">
        <div className="scf-icon si-gray">🏪</div>
        <div className="scf-info">
          <div className="scf-name">Phân phối & Bán lẻ</div>
          <div className="scf-meta">QR scan xác nhận nhận hàng</div>
        </div>
        <div className="scf-right">
          <div className="scf-count">892</div>
          <div className="scf-pct">đã phân phối</div>
        </div>
      </div>
    </div>
  );
}