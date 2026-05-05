'use client';

import React, { useEffect, useState } from 'react';
import { KAFKA_MESSAGES, KAFKA_TOPICS } from "./data";

export interface Driver {
  name: string;
  code: string;
  color: string;
  route: string;
  pct: number;
  status: string;
  cargo: string;
}
export interface TxRow {
  hash: string;
  farm: string;
  type: string;
  cls: string;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  delta: string;
  deltaType?: 'up' | 'down' | 'neutral';
  glyph?: string;
  color?: string;
  id?: string;
}

export function MetricCard({ label, value, delta, deltaType = 'neutral', glyph, color = 'mc-green', id }: MetricCardProps) {
  const deltaClass = deltaType === 'up' ? 'md-up' : deltaType === 'down' ? 'md-down' : 'md-neutral';
  return (
    <div className={`metric-card ${color}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value" id={id}>
        {value}
      </div>
      <div className={`metric-delta ${deltaClass}`}>{delta}</div>
      {glyph && <div className="metric-glyph">{glyph}</div>}
    </div>
  );
}

export function DriverList({ drivers: initialDrivers }: { drivers: Driver[] }) {
  const [drivers, setDrivers] = useState(initialDrivers);
  useEffect(() => {
    const interval = setInterval(() => {
      setDrivers((prev) => prev.map((d) => (d.pct < 98 ? { ...d, pct: Math.min(98, d.pct + (Math.random() < 0.3 ? 1 : 0)) } : d)));
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
            <span className="badge b-pending" style={{ fontSize: '10px' }}>
              {d.status}
            </span>
          </div>
          <div className="driver-route">
            <div className="route-dot"></div> {d.route}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>Hàng: {d.cargo}</div>
          <div className="driver-bar">
            <div className="d-progress">
              <div className="dp-fill" style={{ width: `${d.pct}%`, background: d.pct > 85 ? 'var(--green)' : 'var(--amber)' }}></div>
            </div>
            <span className="driver-pct" style={{ color: d.pct > 85 ? 'var(--green)' : 'var(--amber)' }}>
              {d.pct}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TxTable({ rows }: { rows: TxRow[] }) {
  return (
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>TX Hash</th>
            <th>Farm</th>
            <th>Loại</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.hash}>
              <td>
                <span className="hash">{t.hash}</span>
              </td>
              <td>{t.farm}</td>
              <td>
                <span className={`badge ${t.cls}`}>{t.type}</span>
              </td>
              <td>
                <span className="badge b-ok">● Confirmed</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface KafkaEvent {
  topic: string;
  msg: string;
  time: string;
}

export function KafkaStream({ maxItems = 8, style }: { maxItems?: number; style?: React.CSSProperties }) {
  const [events, setEvents] = useState<KafkaEvent[]>([]);
  const addEvent = () => {
    const i = Math.floor(Math.random() * KAFKA_TOPICS.length);
    const now = new Date();
    const t = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now
      .getSeconds()
      .toString()
      .padStart(2, '0')}`;
    setEvents((prev) => [{ topic: KAFKA_TOPICS[i], msg: KAFKA_MESSAGES[i], time: t }, ...prev].slice(0, maxItems));
  };
  useEffect(() => {
    for (let i = 0; i < Math.min(4, maxItems); i++) setTimeout(addEvent, i * 100);
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

export function LivePill({ label = 'Live' }: { label?: string }) {
  return (
    <div className="live-pill">
      <div className="live-dot"></div> {label}
    </div>
  );
}

