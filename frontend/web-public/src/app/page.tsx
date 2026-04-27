// app/page.tsx — Landing Page (SSG)
// BIC-035: hero + search bar + HowItWorks + FeaturedProducts + stats

import Link from 'next/link';
import { getPublicProducts } from '../data/public-trace-demo';
import './home.css';

const STATS = [
  { value: '1,240+', label: 'Lô hàng đã truy xuất' },
  { value: '320+',   label: 'Nông trại tham gia' },
  { value: '98%',    label: 'Dữ liệu blockchain xác thực' },
  { value: '15+',    label: 'Tỉnh thành phủ sóng' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: '🌾',
    title: 'Nông trại',
    desc: 'Dữ liệu mùa vụ, chăm sóc, thu hoạch được ghi nhận tại nguồn theo thời gian thực.',
  },
  {
    step: '02',
    icon: '⛓',
    title: 'Blockchain',
    desc: 'Thông tin được mã hóa và ghi vĩnh viễn lên VeChainThor — không thể chỉnh sửa hay xóa.',
  },
  {
    step: '03',
    icon: '🛒',
    title: 'Người tiêu dùng',
    desc: 'Tra cứu bằng mã lô hàng để xem ngay toàn bộ hành trình từ đất đến tay bạn.',
  },
];

export default function HomePage() {
  const FEATURED_PRODUCTS = getPublicProducts().slice(0, 6);
  return (
    <main className="home-page">
      <nav className="home-nav">
        <div className="home-nav-inner">
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🌿</span>
            <span style={{ fontFamily: 'Lora, Georgia, serif', fontWeight: 700, fontSize: 18, color: '#1a1a0e' }}>BICAP</span>
            <span
              style={{
                fontSize: 10,
                color: '#aaa',
                fontFamily: '"Be Vietnam Pro", sans-serif',
                letterSpacing: '0.8px',
                marginTop: 2,
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
              }}
            >
              Truy xuất nguồn gốc
            </span>
          </Link>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="#how-it-works" className="nav-link">
              Cách hoạt động
            </a>
            <Link href="/products" className="nav-link">
              Sản phẩm
            </Link>
            <Link href="/articles" className="nav-link">
              Tin tức
            </Link>
            <Link href="/trace" className="nav-qr-btn">
              Tra cứu
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(160deg, #1a3d1a 0%, #2d6a2d 50%, #4a8c4a 100%)',
        padding: '100px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,.03)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}>
          <p className="fade-up fade-up-1" style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', color: '#a8d5a8', marginBottom: 20 }}>
            Blockchain · VeChainThor · Minh bạch
          </p>
          <h1 className="hero-title fade-up fade-up-2" style={{ fontSize: 'clamp(32px, 5.5vw, 62px)', fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 24 }}>
            Biết rõ hành trình{' '}
            <span style={{ color: '#a8d5a8', fontStyle: 'italic' }}>từng hạt gạo</span>{' '}
            đến tay bạn
          </h1>
          <p className="fade-up fade-up-3" style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 17, color: 'rgba(255,255,255,.75)', lineHeight: 1.8, maxWidth: 520, margin: '0 auto 40px' }}>
            Nhập mã lô hàng — xem ngay toàn bộ hành trình nông sản được ghi nhận bất biến trên blockchain.
          </p>

          <div className="fade-up fade-up-4 search-wrap">
            <form action="/trace" method="get">
              <input
                className="search-inp"
                name="id"
                type="text"
                autoComplete="off"
                aria-label="Mã lô hàng"
              />
              <button type="submit" className="search-btn">🔍 Tra cứu</button>
            </form>
          </div>
          <p style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 14 }}>
            Không cần đăng nhập · Hoàn toàn miễn phí
          </p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: '#2d6a2d', padding: '36px 24px' }}>
        <div className="stats-grid">
          {STATS.map((s, i) => (
            <div key={i} className="stat-item">
              <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 34, fontWeight: 700, color: '#fff' }}>{s.value}</div>
              <div
                style={{
                  fontFamily: 'Be Vietnam Pro, sans-serif',
                  fontSize: 13,
                  color: 'rgba(255,255,255,.65)',
                  marginTop: 4,
                  lineHeight: 1.35,
                  wordBreak: 'break-word',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '96px 24px', background: '#fafaf7' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', color: '#2d6a2d', textAlign: 'center', marginBottom: 12 }}>Quy trình</p>
          <h2 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 38, fontWeight: 700, textAlign: 'center', color: '#1a1a0e', marginBottom: 60 }}>Cách hoạt động</h2>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {HOW_IT_WORKS.map((h, i) => (
              <div key={i} className="step-card">
                <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 52, fontWeight: 700, color: '#ede9d8', position: 'absolute', top: 16, right: 20, lineHeight: 1 }}>{h.step}</div>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{h.icon}</div>
                <h3 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 21, fontWeight: 700, color: '#1a1a0e', marginBottom: 10 }}>{h.title}</h3>
                <p style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 15, color: '#5a5a4a', lineHeight: 1.75 }}>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section style={{ padding: '80px 24px', background: '#f2f2ec' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', color: '#2d6a2d', marginBottom: 10 }}>Nổi bật</p>
              <h2 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 34, fontWeight: 700, color: '#1a1a0e' }}>Sản phẩm tiêu biểu</h2>
            </div>
            <Link href="/products" style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 14, fontWeight: 600, color: '#2d6a2d', textDecoration: 'none', borderBottom: '2px solid #2d6a2d', paddingBottom: 2 }}>
              Xem tất cả →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 22 }}>
            {FEATURED_PRODUCTS.map(p => (
              <Link key={p.id} href={`/trace/${p.id}`} style={{ textDecoration: 'none' }}>
                <div className="product-card">
                  <div style={{ background: `linear-gradient(135deg, ${p.color})`, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      p.img
                    )}
                  </div>
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#2d6a2d', marginBottom: 6 }}>
                      {p.origin}
                    </div>
                    <h3 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 18, fontWeight: 600, color: '#1a1a0e', marginBottom: 6, lineHeight: 1.35 }}>{p.name}</h3>
                    <p style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 12, color: '#999', marginBottom: 14 }}>{p.farm}</p>
                    <span style={{ fontSize: 11, background: '#e8f5e9', color: '#2d6a2d', padding: '3px 10px', borderRadius: 99, fontWeight: 600, fontFamily: 'Be Vietnam Pro, sans-serif' }}>
                      ⛓ Blockchain xác thực
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: '96px 24px', background: '#1a3d1a', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 40, fontWeight: 700, color: '#fff', marginBottom: 20, lineHeight: 1.25 }}>
            Tra cứu nguồn gốc ngay hôm nay
          </h2>
          <p style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 16, color: 'rgba(255,255,255,.65)', lineHeight: 1.8, marginBottom: 40 }}>
            Mỗi mã lô là một cam kết minh bạch. Hàng ngàn lô nông sản đang chờ bạn khám phá hành trình của chúng.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/trace" className="cta-btn" style={{ background: '#fff', color: '#1a3d1a' }}>🔍 Tra cứu ngay</Link>
            <Link href="/products" className="cta-btn" style={{ background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,.35)' }}>Xem sản phẩm →</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#111', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>🌿 BICAP</div>
        <p style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 13, color: '#555' }}>
          Blockchain Integration in Clean Agricultural Production · © 2026
        </p>
      </footer>
    </main>
  );
}
