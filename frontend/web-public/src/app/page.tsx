// app/page.tsx — Landing Page (SSG)
// BIC-035: hero + search bar + HowItWorks + FeaturedProducts + stats

import Link from 'next/link';

// ── Mock data (thay bằng fetch từ guest-service:8089 khi có API) ──────────────
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
    desc: 'Quét QR trên bao bì là thấy ngay toàn bộ hành trình từ đất đến tay bạn.',
  },
];

const FEATURED_PRODUCTS = [
  { id: 'SP001', name: 'Gạo ST25 Sóc Trăng', farm: 'Farm Mekong Delta', origin: 'Sóc Trăng', cert: 'VeChain #0xA1B2', img: '🌾' },
  { id: 'SP002', name: 'Cà phê Arabica Đà Lạt', farm: 'Highland Coffee Farm', origin: 'Lâm Đồng', cert: 'VeChain #0xC3D4', img: '☕' },
  { id: 'SP003', name: 'Rau sạch VietGAP', farm: 'Green House Farm', origin: 'Đà Lạt', cert: 'VeChain #0xE5F6', img: '🥬' },
];

export default function HomePage() {
  return (
    <main style={{ fontFamily: "'Georgia', 'Times New Roman', serif", background: '#fafaf7', color: '#1a1a0e', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Sans+3:wght@300;400;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { font-family: 'Source Sans 3', sans-serif; }

        .hero-title { font-family: 'Playfair Display', serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) both; }
        .fade-up-1 { animation-delay: 0.1s; }
        .fade-up-2 { animation-delay: 0.22s; }
        .fade-up-3 { animation-delay: 0.34s; }
        .fade-up-4 { animation-delay: 0.46s; }

        .nav-link {
          color: #3a3a2e; font-size: 14px; font-weight: 600;
          text-decoration: none; letter-spacing: .3px;
          padding: 6px 0; border-bottom: 2px solid transparent;
          transition: border-color 0.2s, color 0.2s;
          font-family: 'Source Sans 3', sans-serif;
        }
        .nav-link:hover { color: #2d6a2d; border-bottom-color: #2d6a2d; }

        .search-wrap { position: relative; max-width: 560px; margin: 0 auto; }
        .search-inp {
          width: 100%; padding: 16px 140px 16px 22px;
          border: 2px solid #d4d4aa; border-radius: 50px;
          font-size: 15px; font-family: 'Source Sans 3', sans-serif;
          background: rgba(255,255,255,0.95); outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          color: #1a1a0e;
        }
        .search-inp:focus { border-color: #2d6a2d; box-shadow: 0 0 0 4px rgba(45,106,45,.1); }
        .search-inp::placeholder { color: #aaa; }
        .search-btn {
          position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
          background: #2d6a2d; color: #fff; border: none; border-radius: 50px;
          padding: 10px 22px; font-size: 14px; font-weight: 700;
          font-family: 'Source Sans 3', sans-serif;
          cursor: pointer; transition: background 0.2s, transform 0.1s;
          white-space: nowrap;
        }
        .search-btn:hover { background: #1e4d1e; }
        .search-btn:active { transform: translateY(-50%) scale(.96); }

        .step-card {
          background: #fff; border: 1px solid #e8e8d8; border-radius: 16px;
          padding: 32px 28px; flex: 1; min-width: 220px;
          position: relative; transition: box-shadow 0.2s, transform 0.2s;
        }
        .step-card:hover { box-shadow: 0 8px 32px rgba(45,106,45,.1); transform: translateY(-4px); }

        .product-card {
          background: #fff; border: 1px solid #e8e8d8; border-radius: 16px;
          overflow: hidden; transition: box-shadow 0.2s, transform 0.2s;
        }
        .product-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,.08); transform: translateY(-4px); }

        .stat-item { text-align: center; padding: 0 28px; }
        .stat-item + .stat-item { border-left: 1px solid rgba(255,255,255,.2); }

        .cta-btn {
          display: inline-block; padding: 14px 32px; border-radius: 50px;
          font-weight: 700; font-size: 15px; text-decoration: none;
          font-family: 'Source Sans 3', sans-serif;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.15); }
        .cta-btn:active { transform: scale(.97); }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(250,250,247,.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8e8d8' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🌿</span>
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 18, color: '#1a1a0e' }}>BICAP</span>
            <span style={{ fontSize: 11, color: '#888', fontFamily: 'Source Sans 3, sans-serif', letterSpacing: '.5px', marginTop: 2 }}>TRUY XUẤT NGUỒN GỐC</span>
          </Link>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            <a href="#how-it-works" className="nav-link">Cách hoạt động</a>
            <Link href="/products" className="nav-link">Sản phẩm</Link>
            <Link href="/articles" className="nav-link">Tin tức</Link>
            <Link href="/trace/demo" className="cta-btn" style={{ background: '#2d6a2d', color: '#fff', padding: '8px 20px', fontSize: 13 }}>Quét QR</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(160deg, #1a3d1a 0%, #2d6a2d 45%, #4a8c4a 100%)',
        padding: '100px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,.03)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}>
          <p className="fade-up fade-up-1" style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#a8d5a8', marginBottom: 20 }}>
            Blockchain · VeChainThor · Minh bạch
          </p>
          <h1 className="hero-title fade-up fade-up-2" style={{ fontSize: 'clamp(38px, 6vw, 68px)', fontWeight: 900, color: '#fff', lineHeight: 1.12, marginBottom: 24 }}>
            Biết rõ hành trình<br />
            <span style={{ color: '#a8d5a8' }}>từng hạt gạo</span> đến tay bạn
          </h1>
          <p className="fade-up fade-up-3" style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 18, color: 'rgba(255,255,255,.75)', lineHeight: 1.7, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
            Quét mã QR trên bao bì — xem ngay toàn bộ hành trình nông sản được ghi nhận bất biến trên blockchain.
          </p>

          {/* Search bar */}
          <div className="fade-up fade-up-4 search-wrap">
            <form action="/trace" method="get">
              <input
                className="search-inp"
                name="id"
                placeholder="Nhập mã QR hoặc mã lô hàng... (VD: LH0001-F32L)"
              />
              <button type="submit" className="search-btn">🔍 Tra cứu</button>
            </form>
          </div>
          <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: 14 }}>
            Không cần đăng nhập · Hoàn toàn miễn phí
          </p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: '#2d6a2d', padding: '36px 24px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0 }}>
          {STATS.map((s, i) => (
            <div key={i} className="stat-item">
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, fontWeight: 700, color: '#fff' }}>{s.value}</div>
              <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 13, color: 'rgba(255,255,255,.65)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '96px 24px', background: '#fafaf7' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#2d6a2d', textAlign: 'center', marginBottom: 14 }}>Quy trình</p>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 40, fontWeight: 700, textAlign: 'center', color: '#1a1a0e', marginBottom: 60 }}>Cách hoạt động</h2>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {HOW_IT_WORKS.map((h, i) => (
              <div key={i} className="step-card">
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 56, fontWeight: 900, color: '#e8e8d8', position: 'absolute', top: 16, right: 20, lineHeight: 1 }}>{h.step}</div>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{h.icon}</div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: '#1a1a0e', marginBottom: 12 }}>{h.title}</h3>
                <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 15, color: '#666', lineHeight: 1.7 }}>{h.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div style={{ position: 'absolute', right: -28, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: '#ccc', display: 'none' }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section style={{ padding: '80px 24px', background: '#f2f2ec' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#2d6a2d', marginBottom: 10 }}>Nổi bật</p>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, fontWeight: 700, color: '#1a1a0e' }}>Sản phẩm tiêu biểu</h2>
            </div>
            <Link href="/products" style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 14, fontWeight: 700, color: '#2d6a2d', textDecoration: 'none', borderBottom: '2px solid #2d6a2d', paddingBottom: 2 }}>
              Xem tất cả →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {FEATURED_PRODUCTS.map(p => (
              <Link key={p.id} href={`/trace/${p.id}`} style={{ textDecoration: 'none' }}>
                <div className="product-card">
                  <div style={{ background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>
                    {p.img}
                  </div>
                  <div style={{ padding: '20px 22px' }}>
                    <div style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#2d6a2d', marginBottom: 8 }}>
                      {p.origin}
                    </div>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#1a1a0e', marginBottom: 8 }}>{p.name}</h3>
                    <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 13, color: '#888', marginBottom: 14 }}>{p.farm}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, background: '#e8f5e9', color: '#2d6a2d', padding: '3px 10px', borderRadius: 99, fontWeight: 700, fontFamily: 'Source Sans 3, sans-serif' }}>
                        ⛓ Blockchain xác thực
                      </span>
                    </div>
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
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 42, fontWeight: 700, color: '#fff', marginBottom: 20, lineHeight: 1.2 }}>
            Quét QR ngay hôm nay
          </h2>
          <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 16, color: 'rgba(255,255,255,.65)', lineHeight: 1.7, marginBottom: 40 }}>
            Mỗi mã QR là một cam kết minh bạch. Hàng ngàn lô nông sản đang chờ bạn khám phá hành trình của chúng.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/trace/demo" className="cta-btn" style={{ background: '#fff', color: '#1a3d1a' }}>🔍 Thử ngay với QR mẫu</Link>
            <Link href="/products" className="cta-btn" style={{ background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,.4)' }}>Xem sản phẩm →</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#111', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>🌿 BICAP</div>
        <p style={{ fontFamily: 'Source Sans 3, sans-serif', fontSize: 13, color: '#666' }}>
          Blockchain Integration in Clean Agricultural Production · © 2026
        </p>
      </footer>
    </main>
  );
}