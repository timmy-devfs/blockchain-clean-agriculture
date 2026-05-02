// app/trace/[qrCode]/page.tsx — SSR Trace Page
// BIC-035: generateMetadata + fetch server-side + farm info + season timeline + blockchain cert + VeChain Explorer
// FIX: Next.js 15 — params is now a Promise, must be awaited

import { Metadata } from 'next';
import Link from 'next/link';
import { PublicNav } from "@/components/public/PublicNav";
import type { TraceData } from "@/public-site/data/public-trace-demo";
import { loadTraceForQr } from "@/lib/trace/loadTrace";

// ── generateMetadata (SSR SEO) ────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ qrCode: string }> }
): Promise<Metadata> {
  const { qrCode } = await params;
  const loaded = await loadTraceForQr(qrCode);
  const data = loaded?.data;
  if (!data) {
    return { title: 'Không tìm thấy | BICAP', description: 'Mã QR không hợp lệ hoặc chưa được đăng ký.' };
  }
  return {
    title: `${data.productName} — ${data.farmName} | BICAP`,
    description: `Truy xuất nguồn gốc: ${data.productName} từ ${data.farmLocation}. Xác thực blockchain VeChainThor.`,
    openGraph: {
      title: `${data.productName} | BICAP Truy xuất nguồn gốc`,
      description: `Sản phẩm từ ${data.farmName}, ${data.farmLocation}. Chứng nhận blockchain: ${data.certNo}`,
      type: 'website',
    },
  };
}

// ── Page Component ─────────────────────────────────────────────────────────────
export default async function TracePage({ params }: { params: Promise<{ qrCode: string }> }) {
  const { qrCode } = await params;
  const loaded = await loadTraceForQr(qrCode);
  const data = loaded?.data;
  const isDemoExample = qrCode.trim().toLowerCase() === 'demo';
  const statusPalette: Record<string, { bg: string; color: string; dot: string }> = {
    'Đang chuẩn bị': { bg: '#fef9c3', color: '#854d0e', dot: '#f59e0b' },
    'Đang vận chuyển': { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
    'Đã giao': { bg: '#dcfce7', color: '#15803d', dot: '#10b981' },
    'Đã hủy': { bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' },
  };
  const timeline = [...(data?.timeline ?? [])].reverse();

  const styles = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Be Vietnam Pro, -apple-system, BlinkMacSystemFont, sans-serif; background: #fafaf7; color: #1a1a0e; }
    .chain-link {
      display: inline-flex; align-items: center; gap: 8px;
      background: #e8f5e9; border: 1px solid #a8d5a8; border-radius: 8px;
      padding: 10px 16px; text-decoration: none;
      font-family: Be Vietnam Pro, sans-serif; font-size: 13px; font-weight: 600; color: #1a3d1a;
      word-break: break-all; transition: background 0.2s;
    }
    .chain-link:hover { background: #c8e6c9; }
    @media (max-width: 600px) {
      .hero-inner { padding: 24px 16px !important; }
      .info-grid { grid-template-columns: 1fr !important; }
    }
  `;

  // ── Not found ──
  if (!data) {
    return (
      <main style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <style>{styles}</style>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <PublicNav />
        </div>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🔍</div>
        <h1 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 28, fontWeight: 700, color: '#1a1a0e', marginBottom: 12 }}>
          Không tìm thấy sản phẩm với mã này
        </h1>
        <p style={{ fontSize: 15, color: '#888', marginBottom: 32, maxWidth: 400 }}>
          Mã <code style={{ background: '#f0f0e8', padding: '2px 8px', borderRadius: 4 }}>{qrCode}</code> chưa được đăng ký hoặc không hợp lệ.
        </p>
        <Link href="/" style={{ display: 'inline-block', background: '#2d6a2d', color: '#fff', padding: '12px 28px', borderRadius: 50, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
          ← Về trang chủ
        </Link>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf7', fontFamily: '"Be Vietnam Pro", -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <style>{styles}</style>
      <PublicNav />

      {/* ── HEADER ── */}
      <header style={{ background: '#1a3d1a', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
          Truy xuất nguồn gốc · Mã lô
        </div>
        <Link href="/huong-dan" style={{ fontSize: 12, color: '#a8d5a8', fontWeight: 600, textDecoration: 'none' }}>
          Hướng dẫn tra cứu →
        </Link>
      </header>

      {/* ── HERO BAND ── */}
      <section style={{ background: 'linear-gradient(135deg, #2d6a2d, #4a8c4a)', padding: '40px 24px' }}>
        <div className="hero-inner" style={{ maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 'clamp(22px, 4.5vw, 36px)', fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.25 }}>
            {data.productName}
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.75)', marginBottom: 4 }}>🏡 {data.farmName} · {data.farmLocation}</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', fontFamily: 'monospace' }}>Mã lô: {data.id}</p>
        </div>
      </section>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>

        {isDemoExample && (
          <div
            style={{
              background: '#fefce8',
              border: '1px solid #fde047',
              borderRadius: 12,
              padding: '14px 18px',
              marginBottom: 24,
              fontSize: 14,
              color: '#713f12',
              lineHeight: 1.65,
            }}
          >
            <strong>Đây là trang ví dụ cho khách tham quan.</strong> Bạn chưa cần mã thật — nội dung hiển thị giống khi tra cứu mã lô hàng thực tế (nông trại, nguồn gốc, blockchain). Khi mua sản phẩm có tem BICAP, hãy nhập đúng mã in trên bao bì để xem thông tin.
          </div>
        )}

        {/* ── FARM INFO ── */}
        <section style={{ background: '#fff', border: '1px solid #e8e8d8', borderRadius: 16, padding: '24px 28px', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 19, fontWeight: 700, color: '#1a1a0e', marginBottom: 20 }}>🌾 Thông tin nông trại</h2>
          <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Nông trại', value: data.farmName },
              { label: 'Địa điểm', value: data.farmLocation },
              { label: 'Chủ nông trại', value: data.farmOwner },
              { label: 'Ngày thu hoạch', value: data.harvestDate },
              { label: 'Chứng nhận', value: data.certNo },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#aaa', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a0e' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SHIPPING TIMELINE ── */}
        <section style={{ background: '#fff', border: '1px solid #e8e8d8', borderRadius: 16, padding: '24px 28px', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 19, fontWeight: 700, color: '#1a1a0e', marginBottom: 16 }}>📋 Lịch sử vận chuyển</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            {timeline.length > 0 ? timeline.map((step, idx) => {
              const c = statusPalette[step.label] ?? { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' };
              return (
                <div key={`${step.time}-${step.label}-${idx}`} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: c.dot, marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>{step.time}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: c.color, marginBottom: 3 }}>{step.label}</div>
                    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.55 }}>{step.desc}</div>
                  </div>
                </div>
              );
            }) : (
              <p style={{ fontSize: 14, color: '#64748b' }}>Chưa có lịch sử cập nhật trạng thái.</p>
            )}
          </div>
        </section>

        {/* ── BLOCKCHAIN CERT ── */}
        <section style={{ background: '#1a3d1a', borderRadius: 16, padding: '24px 28px', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 19, fontWeight: 700, color: '#fff', marginBottom: 8 }}>⛓ Chứng nhận Blockchain</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginBottom: 20 }}>
            Dữ liệu được ghi vĩnh viễn trên VeChainThor — không thể sửa đổi hay xóa.
          </p>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 8 }}>Transaction ID</div>
            <a
              href={`https://explore.vechain.org/transactions/${data.blockchainTxId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="chain-link"
            >
              <span>🔗</span>
              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{data.blockchainTxId.slice(0, 20)}...{data.blockchainTxId.slice(-8)}</span>
              <span style={{ marginLeft: 'auto', flexShrink: 0 }}>↗</span>
            </a>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
            Xem đầy đủ trên VeChain Explorer →
          </p>
        </section>

        {/* ── BACK ── */}
        <div style={{ textAlign: 'center', paddingBottom: 40 }}>
          <Link href="/" style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 14, fontWeight: 600, color: '#2d6a2d', textDecoration: 'none', borderBottom: '2px solid #2d6a2d', paddingBottom: 2 }}>
            ← Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}