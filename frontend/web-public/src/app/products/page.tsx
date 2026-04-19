// app/products/page.tsx — Products SSR + filter + CTA
// BIC-035: Products SSR + filter, product detail + CTA

import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sản phẩm nông sản sạch | BICAP',
  description: 'Danh sách sản phẩm nông sản có truy xuất nguồn gốc blockchain VeChainThor.',
};

const PRODUCTS = [
  { id: 'SP001', name: 'Gạo ST25 Sóc Trăng', farm: 'Farm Mekong Delta', origin: 'Sóc Trăng', type: 'Ngũ cốc', cert: true, img: '🌾', desc: 'Gạo thơm đặc sản, đạt giải gạo ngon nhất thế giới.' },
  { id: 'SP002', name: 'Cà phê Arabica Đà Lạt', farm: 'Highland Coffee Farm', origin: 'Lâm Đồng', type: 'Đồ uống', cert: true, img: '☕', desc: 'Cà phê cao nguyên, độ cao 1500m, hái tay tuyển chọn.' },
  { id: 'SP003', name: 'Rau sạch VietGAP', farm: 'Green House Farm', origin: 'Đà Lạt', type: 'Rau củ', cert: true, img: '🥬', desc: 'Rau trồng trong nhà kính, không thuốc trừ sâu.' },
  { id: 'SP004', name: 'Thanh long ruột đỏ', farm: 'Dragon Fruit Farm', origin: 'Bình Thuận', type: 'Trái cây', cert: true, img: '🐉', desc: 'Thanh long xuất khẩu, đạt tiêu chuẩn GlobalGAP.' },
  { id: 'SP005', name: 'Mật ong rừng nguyên chất', farm: 'Bee Natural Farm', origin: 'Đắk Lắk', type: 'Mật ong', cert: true, img: '🍯', desc: 'Mật ong khai thác từ rừng nguyên sinh Tây Nguyên.' },
  { id: 'SP006', name: 'Xoài cát Hòa Lộc', farm: 'Mango King Farm', origin: 'Tiền Giang', type: 'Trái cây', cert: false, img: '🥭', desc: 'Xoài đặc sản miền Tây, ngọt thơm tự nhiên.' },
];

const TYPES = ['Tất cả', 'Ngũ cốc', 'Trái cây', 'Rau củ', 'Đồ uống', 'Mật ong'];

export default async function ProductsPage({ searchParams }: { searchParams: { type?: string } }) {
  const activeType = searchParams.type || 'Tất cả';
  const filtered = activeType === 'Tất cả' ? PRODUCTS : PRODUCTS.filter(p => p.type === activeType);

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Source+Sans+3:wght@300;400;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Source Sans 3', sans-serif; background: #fafaf7; }
    .filter-btn {
      padding: 8px 18px; border-radius: 50px; font-size: 13px; font-weight: 600;
      font-family: 'Source Sans 3', sans-serif; text-decoration: none; border: 2px solid #e8e8d8;
      transition: all 0.15s; white-space: nowrap; color: #666; background: #fff;
    }
    .filter-btn.active { background: #2d6a2d; color: #fff; border-color: #2d6a2d; }
    .filter-btn:not(.active):hover { border-color: #2d6a2d; color: #2d6a2d; }
    .product-card { background: #fff; border: 1px solid #e8e8d8; border-radius: 16px; overflow: hidden; transition: box-shadow 0.2s, transform 0.2s; text-decoration: none; display: block; }
    .product-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,.08); transform: translateY(-4px); }
    .nav-link { color: #3a3a2e; font-size: 14px; font-weight: 600; text-decoration: none; padding: 6px 0; border-bottom: 2px solid transparent; transition: border-color 0.2s, color 0.2s; }
    .nav-link:hover { color: #2d6a2d; border-bottom-color: #2d6a2d; }
  `;

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf7', fontFamily: 'Source Sans 3, sans-serif' }}>
      <style>{styles}</style>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(250,250,247,.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8e8d8' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🌿</span>
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 16, color: '#1a1a0e' }}>BICAP</span>
          </Link>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/#how-it-works" className="nav-link">Cách hoạt động</Link>
            <Link href="/products" className="nav-link" style={{ color: '#2d6a2d', borderBottomColor: '#2d6a2d' }}>Sản phẩm</Link>
            <Link href="/articles" className="nav-link">Tin tức</Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section style={{ background: 'linear-gradient(135deg, #2d6a2d, #4a8c4a)', padding: '56px 24px 48px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', marginBottom: 12 }}>Danh mục</p>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 42, fontWeight: 700, color: '#fff' }}>Sản phẩm nông sản sạch</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.7)', marginTop: 12 }}>Mỗi sản phẩm đều có chứng nhận blockchain · Truy xuất nguồn gốc tức thì</p>
        </div>
      </section>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 24px' }}>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
          {TYPES.map(t => (
            <Link key={t} href={t === 'Tất cả' ? '/products' : `/products?type=${encodeURIComponent(t)}`} className={`filter-btn${activeType === t ? ' active' : ''}`}>
              {t}
            </Link>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {filtered.map(p => (
            <Link key={p.id} href={`/trace/${p.id}`} className="product-card">
              <div style={{ background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
                {p.img}
              </div>
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#2d6a2d' }}>{p.origin}</span>
                  {p.cert && <span style={{ fontSize: 10, background: '#e8f5e9', color: '#2d6a2d', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>⛓ BC</span>}
                </div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 19, fontWeight: 700, color: '#1a1a0e', marginBottom: 6 }}>{p.name}</h3>
                <p style={{ fontSize: 13, color: '#888', marginBottom: 12, lineHeight: 1.5 }}>{p.desc}</p>
                <div style={{ fontSize: 12, color: '#aaa' }}>🏡 {p.farm}</div>
                <div style={{ marginTop: 16, padding: '10px 16px', background: '#2d6a2d', borderRadius: 8, textAlign: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                  🔍 Xem nguồn gốc →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#ccc' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
            <p style={{ fontSize: 16 }}>Chưa có sản phẩm trong danh mục này.</p>
          </div>
        )}
      </div>
    </main>
  );
}