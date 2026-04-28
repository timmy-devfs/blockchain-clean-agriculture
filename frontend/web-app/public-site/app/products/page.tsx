// app/products/page.tsx — Products SSR + filter + CTA

import Link from 'next/link';
import { Metadata } from 'next';
import { PublicNav } from '../../components/PublicNav';
import { getPublicProducts } from '../../data/public-trace-demo';

export const metadata: Metadata = {
  title: 'Sản phẩm nông sản sạch | BICAP',
  description: 'Danh sách sản phẩm nông sản có truy xuất nguồn gốc blockchain VeChainThor.',
};

const TYPES = ['Tất cả', 'Ngũ cốc', 'Trái cây', 'Rau củ', 'Đồ uống', 'Đặc sản'];

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const params = await searchParams;
  const PRODUCTS = getPublicProducts();
  const activeType = params.type || 'Tất cả';
  const filtered = activeType === 'Tất cả' ? PRODUCTS : PRODUCTS.filter(p => p.type === activeType);

  const styles = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, sans-serif; background: #fafaf7; }
    .filter-btn {
      padding: 8px 20px; border-radius: 50px; font-size: 13px; font-weight: 500;
      font-family: "Be Vietnam Pro", sans-serif; text-decoration: none; border: 1.5px solid #e0e0d0;
      transition: all 0.15s; white-space: nowrap; color: #666; background: #fff; cursor: pointer;
    }
    .filter-btn.active { background: #2d6a2d; color: #fff; border-color: #2d6a2d; }
    .filter-btn:not(.active):hover { border-color: #2d6a2d; color: #2d6a2d; }
    .product-card {
      background: #fff; border: 1px solid #e8e8d8; border-radius: 16px;
      overflow: hidden; transition: box-shadow 0.2s, transform 0.2s;
      text-decoration: none; display: block;
    }
    .product-card:hover { box-shadow: 0 10px 36px rgba(0,0,0,.09); transform: translateY(-4px); }
  `;

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf7', fontFamily: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{styles}</style>

      <PublicNav active="products" />

      {/* Header */}
      <section style={{ background: 'linear-gradient(135deg, #2d6a2d, #4a8c4a)', padding: '56px 24px 48px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', marginBottom: 12, fontFamily: 'Be Vietnam Pro, sans-serif' }}>Danh mục</p>
          <h1 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 40, fontWeight: 700, color: '#fff' }}>Sản phẩm nông sản sạch</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.7)', marginTop: 12, fontFamily: 'Be Vietnam Pro, sans-serif' }}>
            {PRODUCTS.length} sản phẩm · Mỗi sản phẩm đều có chứng nhận blockchain · Truy xuất nguồn gốc tức thì
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 24px' }}>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
          {TYPES.map(t => (
            <Link
              key={t}
              href={t === 'Tất cả' ? '/products' : `/products?type=${encodeURIComponent(t)}`}
              className={`filter-btn${activeType === t ? ' active' : ''}`}
            >
              {t}
            </Link>
          ))}
        </div>

        {/* Count */}
        <p style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 13, color: '#aaa', marginBottom: 24 }}>
          Hiển thị <strong style={{ color: '#1a1a0e' }}>{filtered.length}</strong> sản phẩm
          {activeType !== 'Tất cả' ? ` trong "${activeType}"` : ''}
        </p>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 22 }}>
          {filtered.map(p => (
            <Link key={p.id} href={`/trace/${p.id}`} className="product-card">
              <div style={{ background: `linear-gradient(135deg, ${p.color})`, height: 148, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#2d6a2d', fontFamily: 'Be Vietnam Pro, sans-serif' }}>{p.origin}</span>
                  {p.cert
                    ? <span style={{ fontSize: 10, background: '#e8f5e9', color: '#2d6a2d', padding: '2px 8px', borderRadius: 99, fontWeight: 600, fontFamily: 'Be Vietnam Pro, sans-serif' }}>⛓ Xác thực</span>
                    : <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 99, fontWeight: 600, fontFamily: 'Be Vietnam Pro, sans-serif' }}>Đang cập nhật</span>
                  }
                </div>
                <h3 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 18, fontWeight: 600, color: '#1a1a0e', marginBottom: 6, lineHeight: 1.4 }}>{p.name}</h3>
                <p style={{ fontSize: 13, color: '#777', marginBottom: 14, lineHeight: 1.6, fontFamily: 'Be Vietnam Pro, sans-serif' }}>{p.desc}</p>
                <div style={{ fontSize: 12, color: '#bbb', fontFamily: 'Be Vietnam Pro, sans-serif', marginBottom: 12 }}>🏡 {p.farm}</div>
                <div style={{ padding: '10px 16px', background: '#2d6a2d', borderRadius: 10, textAlign: 'center', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'Be Vietnam Pro, sans-serif' }}>
                  Xem nguồn gốc →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#ccc' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
            <p style={{ fontSize: 16, fontFamily: 'Be Vietnam Pro, sans-serif' }}>Chưa có sản phẩm trong danh mục này.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background: '#111', padding: '36px 24px', textAlign: 'center', marginTop: 48 }}>
        <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>🌿 BICAP</div>
        <p style={{ fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: 13, color: '#555' }}>
          Blockchain Integration in Clean Agricultural Production · © 2026
        </p>
      </footer>
    </main>
  );
}
