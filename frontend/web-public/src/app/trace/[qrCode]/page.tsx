// app/trace/[qrCode]/page.tsx — SSR Trace Page
// BIC-035: generateMetadata + fetch server-side + farm info + season timeline + blockchain cert + VeChain Explorer
// FIX: Next.js 15 — params is now a Promise, must be awaited

import { Metadata } from 'next';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────
interface TraceData {
  id: string;
  productName: string;
  farmName: string;
  farmLocation: string;
  farmOwner: string;
  harvestDate: string;
  certNo: string;
  blockchainTxId: string;
  status: string;
  timeline: { time: string; label: string; desc: string; icon: string }[];
}

// ── Server-side fetch (thay URL khi có guest-service:8089) ────────────────────
async function fetchTraceData(qrCode: string): Promise<TraceData | null> {
  // TODO: thay bằng fetch(`http://guest-service:8089/api/public/trace/${qrCode}`)
  // Demo data để SSR render ngay
  if (qrCode === 'demo' || qrCode.startsWith('LH') || qrCode.startsWith('SP')) {
    return {
      id: qrCode,
      productName: 'Gạo ST25 Sóc Trăng',
      farmName: 'Farm Mekong Delta',
      farmLocation: 'Sóc Trăng, Việt Nam',
      farmOwner: 'Nguyễn Văn An',
      harvestDate: '15/03/2026',
      certNo: 'VietGAP-2026-00412',
      blockchainTxId: '0xa1b092c5f371090db09899f1a61bc78a08ddabcd',
      status: 'Đã giao',
      timeline: [
        { time: '01/03/2026 06:00', label: 'Bắt đầu mùa vụ', desc: 'Gieo sạ tại cánh đồng A3, diện tích 2.5 ha', icon: '🌱' },
        { time: '08/03/2026 14:30', label: 'Kiểm tra sinh trưởng', desc: 'Cây lúa phát triển tốt, không phát hiện sâu bệnh', icon: '🔬' },
        { time: '15/03/2026 07:00', label: 'Thu hoạch', desc: 'Thu hoạch đạt 6.2 tấn/ha, độ ẩm 14%', icon: '🌾' },
        { time: '15/03/2026 15:00', label: 'Đóng gói & Niêm phong', desc: 'Đóng gói 500 bao 25kg, dán QR blockchain', icon: '📦' },
        { time: '16/03/2026 08:00', label: 'Xuất kho vận chuyển', desc: 'Bàn giao cho đơn vị vận chuyển AgriChain', icon: '🚚' },
        { time: '18/03/2026 10:30', label: 'Giao hàng thành công', desc: 'Nhận hàng tại siêu thị Co.opmart Hà Nội', icon: '✅' },
      ],
    };
  }
  return null;
}

// ── generateMetadata (SSR SEO) ────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ qrCode: string }> }
): Promise<Metadata> {
  const { qrCode } = await params;
  const data = await fetchTraceData(qrCode);
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
  const data = await fetchTraceData(qrCode);

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Source+Sans+3:wght@300;400;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Source Sans 3', sans-serif; background: #fafaf7; color: #1a1a0e; }
    .tl-line { position: absolute; left: 19px; top: 28px; bottom: 0; width: 2px; background: linear-gradient(to bottom, #2d6a2d, #a8d5a8); }
    .chain-link {
      display: inline-flex; align-items: center; gap: 8px;
      background: #e8f5e9; border: 1px solid #a8d5a8; border-radius: 8px;
      padding: 10px 16px; text-decoration: none;
      font-family: 'Source Sans 3', sans-serif; font-size: 13px; font-weight: 600; color: #1a3d1a;
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
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <style>{styles}</style>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🔍</div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#1a1a0e', marginBottom: 12 }}>
          Không tìm thấy lô hàng
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
    <main style={{ minHeight: '100vh', background: '#fafaf7', fontFamily: 'Source Sans 3, sans-serif' }}>
      <style>{styles}</style>

      {/* ── HEADER ── */}
      <header style={{ background: '#1a3d1a', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🌿</span>
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 16, color: '#fff' }}>BICAP</span>
        </Link>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Truy xuất nguồn gốc</span>
      </header>

      {/* ── HERO BAND ── */}
      <section style={{ background: 'linear-gradient(135deg, #2d6a2d, #4a8c4a)', padding: '40px 24px' }}>
        <div className="hero-inner" style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,.2)', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 99 }}>
              ⛓ Blockchain xác thực
            </span>
            <span style={{
              background: data.status === 'Đã giao' ? '#a8d5a8' : '#fde68a',
              color: data.status === 'Đã giao' ? '#1a3d1a' : '#78350f',
              fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 99,
            }}>
              {data.status}
            </span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(24px, 5vw, 38px)', fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.2 }}>
            {data.productName}
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.75)', marginBottom: 4 }}>🏡 {data.farmName} · {data.farmLocation}</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', fontFamily: 'monospace' }}>Mã lô: {data.id}</p>
        </div>
      </section>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── FARM INFO ── */}
        <section style={{ background: '#fff', border: '1px solid #e8e8d8', borderRadius: 16, padding: '24px 28px', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#1a1a0e', marginBottom: 20 }}>🌾 Thông tin nông trại</h2>
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

        {/* ── TIMELINE ── */}
        <section style={{ background: '#fff', border: '1px solid #e8e8d8', borderRadius: 16, padding: '24px 28px', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#1a1a0e', marginBottom: 24 }}>📋 Hành trình lô hàng</h2>
          <div style={{ position: 'relative' }}>
            {data.timeline.map((ev, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, paddingBottom: i < data.timeline.length - 1 ? 28 : 0, position: 'relative' }}>
                {/* Line */}
                {i < data.timeline.length - 1 && (
                  <div style={{ position: 'absolute', left: 19, top: 40, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #2d6a2d44, #2d6a2d11)' }} />
                )}
                {/* Icon */}
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: i === data.timeline.length - 1 ? '#2d6a2d' : '#f2f2ec', border: `2px solid ${i === data.timeline.length - 1 ? '#2d6a2d' : '#e8e8d8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {ev.icon}
                </div>
                {/* Content */}
                <div style={{ paddingTop: 6 }}>
                  <div style={{ fontSize: 11, color: '#aaa', fontFamily: 'monospace', marginBottom: 2 }}>{ev.time}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a0e', marginBottom: 2 }}>{ev.label}</div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{ev.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BLOCKCHAIN CERT ── */}
        <section style={{ background: '#1a3d1a', borderRadius: 16, padding: '24px 28px', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>⛓ Chứng nhận Blockchain</h2>
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
          <Link href="/" style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 14, fontWeight: 600, color: '#2d6a2d', textDecoration: 'none', borderBottom: '2px solid #2d6a2d', paddingBottom: 2 }}>
            ← Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}