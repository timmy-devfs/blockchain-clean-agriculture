// app/articles/page.tsx — Danh sách bài viết + link chi tiết

import Link from 'next/link';
import { Metadata } from 'next';
import { PublicNav } from '../../components/PublicNav';
import { ARTICLES_INDEX } from '../../data/articles-content';

export const metadata: Metadata = {
  title: 'Tin tức & Kiến thức nông nghiệp | BICAP',
  description: 'Cập nhật tin tức blockchain trong nông nghiệp sạch, truy xuất nguồn gốc và công nghệ VeChainThor.',
  openGraph: {
    title: 'Tin tức nông nghiệp blockchain | BICAP',
    description: 'Kiến thức về blockchain, truy xuất nguồn gốc và nông nghiệp sạch.',
    type: 'website',
  },
};

const CATEGORIES = ['Tất cả', 'Blockchain', 'Công nghệ', 'Câu chuyện sản phẩm', 'Hướng dẫn'];

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }> | { cat?: string };
}) {
  const sp = await Promise.resolve(searchParams);
  const cat = sp.cat || 'Tất cả';
  const filtered =
    cat === 'Tất cả' ? ARTICLES_INDEX : ARTICLES_INDEX.filter((a) => a.category === cat);
  const hero = filtered[0];
  const rest = filtered.slice(1);

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf7' }}>
      <PublicNav active="articles" />

      <section style={{ background: 'linear-gradient(135deg, #1a3d1a, #2d6a2d)', padding: '56px 24px 48px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 12 }}>
            Kiến thức
          </p>
          <h1 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 40, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Tin tức & Bài viết</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.65)', lineHeight: 1.65 }}>
            Blockchain, nông nghiệp sạch và công nghệ truy xuất nguồn gốc — bấm vào bài để đọc nội dung đầy đủ.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40 }}>
          {CATEGORIES.map((c) => {
            const active = c === cat;
            const href = c === 'Tất cả' ? '/articles' : `/articles?cat=${encodeURIComponent(c)}`;
            return (
              <Link
                key={c}
                href={href}
                style={{
                  padding: '8px 18px',
                  borderRadius: 50,
                  fontSize: 13,
                  fontWeight: 600,
                  border: active ? '2px solid #2d6a2d' : '2px solid #e8e8d8',
                  background: active ? '#2d6a2d' : '#fff',
                  color: active ? '#fff' : '#666',
                  textDecoration: 'none',
                }}
              >
                {c}
              </Link>
            );
          })}
        </div>

        {hero ? (
          <Link
            href={`/articles/${hero.id}`}
            style={{
              marginBottom: 24,
              display: 'block',
              background: '#fff',
              border: '1px solid #e8e8d8',
              borderRadius: 16,
              overflow: 'hidden',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #1a3d1a, #4a8c4a)',
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 80,
                }}
              >
                {hero.img}
              </div>
              <div style={{ padding: '28px 32px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      background: '#e8f5e9',
                      color: '#2d6a2d',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 99,
                    }}
                  >
                    {hero.category}
                  </span>
                  <span style={{ fontSize: 12, color: '#aaa' }}>
                    {hero.date} · {hero.readTime} đọc
                  </span>
                </div>
                <h2 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 26, fontWeight: 700, color: '#1a1a0e', marginBottom: 12, lineHeight: 1.35 }}>
                  {hero.title}
                </h2>
                <p style={{ fontSize: 15, color: '#666', lineHeight: 1.7 }}>{hero.excerpt}</p>
                <div style={{ marginTop: 20, fontSize: 14, fontWeight: 700, color: '#2d6a2d' }}>Đọc tiếp →</div>
              </div>
            </div>
          </Link>
        ) : (
          <p style={{ padding: '24px 0', color: '#888' }}>Chưa có bài viết trong mục này.</p>
        )}

        <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
          {filtered.length === ARTICLES_INDEX.length
            ? `Tất cả ${ARTICLES_INDEX.length} bài viết`
            : `Hiển thị ${filtered.length} bài trong mục “${cat}”`}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {rest.map((a) => (
            <Link
              key={a.id}
              href={`/articles/${a.id}`}
              style={{
                background: '#fff',
                border: '1px solid #e8e8d8',
                borderRadius: 16,
                overflow: 'hidden',
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 52,
                }}
              >
                {a.img}
              </div>
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      background: '#e8f5e9',
                      color: '#2d6a2d',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 99,
                    }}
                  >
                    {a.category}
                  </span>
                  <span style={{ fontSize: 11, color: '#aaa' }}>{a.readTime} đọc</span>
                </div>
                <h3 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 18, fontWeight: 600, color: '#1a1a0e', marginBottom: 8, lineHeight: 1.4 }}>
                  {a.title}
                </h3>
                <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{a.excerpt}</p>
                <div style={{ marginTop: 14, fontSize: 13, fontWeight: 700, color: '#2d6a2d' }}>Đọc tiếp →</div>
              </div>
            </Link>
          ))}
        </div>

      </div>

      <footer style={{ background: '#111', padding: '36px 24px', textAlign: 'center', marginTop: 32 }}>
        <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>🌿 BICAP</div>
        <p style={{ fontSize: 13, color: '#555' }}>Blockchain Integration in Clean Agricultural Production · © 2026</p>
      </footer>
    </main>
  );
}
