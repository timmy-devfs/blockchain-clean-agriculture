'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useState } from 'react';

function buildTraceUrl(base: string, traceId: string): string {
  return `${base.replace(/\/$/, '')}/trace/${encodeURIComponent(traceId)}`;
}

type Props = {
  traceId: string;
  /** Cạnh QR (px) */
  size?: number;
  /** Hiện nhãn gợi ý bên dưới */
  caption?: boolean;
};

/**
 * QR chứa URL đầy đủ tới trang truy xuất `/trace/{traceId}` (điện thoại quét mở được ngay).
 * `NEXT_PUBLIC_SITE_URL` (vd https://bicap.example.com) giúp URL trong QR đúng khi build/tải trước; không có thì dùng `window.location.origin` sau khi vào web.
 */
export function TraceQrCode({ traceId, size = 88, caption = true }: Props) {
  const [origin, setOrigin] = useState('');
  const envBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || '';

  useEffect(() => {
    setOrigin(typeof window !== 'undefined' ? window.location.origin : '');
  }, []);

  const value = useMemo(() => {
    const base = envBase || origin;
    if (!base) return '';
    return buildTraceUrl(base, traceId);
  }, [envBase, origin, traceId]);

  const ready = value.length > 0;

  if (!ready) {
    return (
      <div
        style={{
          width: size + 12,
          minHeight: size + 12,
          background: '#f4f4ee',
          borderRadius: 10,
          border: '1px dashed #d4d4c8',
        }}
        aria-hidden
      />
    );
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          background: '#fff',
          padding: 6,
          borderRadius: 10,
          border: '1px solid #e8e8d8',
          lineHeight: 0,
        }}
      >
        <QRCodeSVG value={value} size={size} level="M" includeMargin={false} />
      </div>
      {caption && (
        <span style={{ fontSize: 10, color: '#888', textAlign: 'center', maxWidth: size + 40, lineHeight: 1.35 }}>
          Quét mở trang truy xuất · {traceId}
        </span>
      )}
    </div>
  );
}
