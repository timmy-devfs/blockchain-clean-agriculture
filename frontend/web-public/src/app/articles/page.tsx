// app/articles/page.tsx — Articles SSG + Open Graph meta
// BIC-035: Articles SSG + Open Graph meta

import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tin tức & Kiến thức nông nghiệp | BICAP',
  description: 'Cập nhật tin tức blockchain trong nông nghiệp sạch, truy xuất nguồn gốc và công nghệ VeChainThor.',
  openGraph: {
    title: 'Tin tức nông nghiệp blockchain | BICAP',
    description: 'Kiến thức về blockchain, truy xuất nguồn gốc và nông nghiệp sạch.',
    type: 'website',
  },
};

const ARTICLES = [
  {
    id: 'a001',
    title: 'VeChainThor và cuộc cách mạng truy xuất nguồn gốc nông sản Việt Nam',
    excerpt: 'Tìm hiểu cách công nghệ blockchain VeChainThor đang thay đổi cách người tiêu dùng tiếp cận thông tin về thực phẩm họ ăn mỗi ngày.',
    category: 'Blockchain',
    date: '15/04/2026',
    readTime: '5 phút',
    img: '⛓',
  },
  {
    id: 'a002',
    title: 'Gạo ST25 — Hành trình từ đồng ruộng Sóc Trăng đến bàn ăn toàn cầu',
    excerpt: 'Câu chuyện về loại gạo được bình chọn ngon nhất thế giới và hành trình minh bạch hóa chuỗi cung ứng bằng công nghệ số.',
    category: 'Câu chuyện sản phẩm',
    date: '10/04/2026',
    readTime: '4 phút',
    img: '🌾',
  },
  {
    id: 'a003',
    title: '5 lý do người tiêu dùng nên quan tâm đến QR Code trên bao bì thực phẩm',
    excerpt: 'Không phải mọi QR đều như nhau. Chúng tôi giải thích tại sao QR blockchain khác biệt và mang lại giá trị thực sự cho người mua.',
    category: 'Hướng dẫn',
    date: '05/04/2026',
    readTime: '3 phút',
    img: '📱',
  },
  {
    id: 'a004',
    title: 'Nông nghiệp sạch và IoT: Cảm biến thông minh theo dõi từng giai đoạn sinh trưởng',
    excerpt: 'Hệ thống IoT của BICAP ghi nhận nhiệt độ, độ ẩm, pH đất theo thời gian thực — toàn bộ được đưa lên blockchain.',
    category: 'Công nghệ',
    date: '01/04/2026',
    readTime: '6 phút',
    img: '🌡',
  },
];

const CATEGORIES = ['Tất cả', 'Blockchain', 'Công nghệ', 'Câu chuyện sản phẩm', 'Hướng dẫn'];

export default function ArticlesPage() {
  const styles = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif; background: #fafaf7; }
    .article-card { background: #fff; border: 1px solid #e8e8d8; border-radius: 16px; overflow: hidden; transition: box-shadow 0.2s, transform 0.2s; text-decoration: none; display: block; }
    .article-card:hover { box-shadow: 0 10px 36px rgba(0,0,0,.09); transform: translateY(-3px); }
    .cat-tag { display: inline-block; background: #e8f5e9; color: #2d6a2d; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 99px; letter-spacing: .5px; font-family: 'Be Vietnam Pro', sans-serif; }
    .nav-link { color: #3a3a2e; font-size: 14px; font-weight: 500; text-decoration: none; padding: 6px 0; border-bottom: 2px solid transparent; transition: border-color 0.2s, color 0.2s; font-family: 'Be Vietnam Pro', sans-serif; }
    .nav-link:hover { color: #2d6a2d; border-bottom-color: #2d6a2d; }
  `;

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf7' }}>
      <style>{styles}</style>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(250,250,247,.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8e8d8' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🌿</span>
            <span style={{ fontFamily: 'Lora, Georgia, serif', fontWeight: 700, fontSize: 16, color: '#1a1a0e' }}>BICAP</span>
          </Link>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/#how-it-works" className="nav-link">Cách hoạt động</Link>
            <Link href="/products" className="nav-link">Sản phẩm</Link>
            <Link href="/articles" className="nav-link" style={{ color: '#2d6a2d', borderBottomColor: '#2d6a2d' }}>Tin tức</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a3d1a, #2d6a2d)', padding: '56px 24px 48px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 12 }}>Kiến thức</p>
          <h1 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 40, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Tin tức & Bài viết</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.65)' }}>Blockchain, nông nghiệp sạch và công nghệ truy xuất nguồn gốc</p>
        </div>
      </section>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 24px' }}>

        {/* Categories */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40 }}>
          {CATEGORIES.map(c => (
            <button key={c} style={{
              padding: '8px 18px', borderRadius: 50, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: c === 'Tất cả' ? '2px solid #2d6a2d' : '2px solid #e8e8d8',
              background: c === 'Tất cả' ? '#2d6a2d' : '#fff',
              color: c === 'Tất cả' ? '#fff' : '#666',
              fontFamily: 'Be Vietnam Pro, sans-serif',
            }}>{c}</button>
          ))}
        </div>

        {/* Featured article (first) */}
        <Link href={`/articles/${ARTICLES[0].id}`} className="article-card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'linear-gradient(135deg, #1a3d1a, #4a8c4a)', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>
              {ARTICLES[0].img}
            </div>
            <div style={{ padding: '28px 32px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                <span className="cat-tag">{ARTICLES[0].category}</span>
                <span style={{ fontSize: 12, color: '#aaa' }}>{ARTICLES[0].date} · {ARTICLES[0].readTime} đọc</span>
              </div>
              <h2 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 26, fontWeight: 700, color: '#1a1a0e', marginBottom: 12, lineHeight: 1.35 }}>{ARTICLES[0].title}</h2>
              <p style={{ fontSize: 15, color: '#666', lineHeight: 1.7 }}>{ARTICLES[0].excerpt}</p>
              <div style={{ marginTop: 20, fontSize: 14, fontWeight: 700, color: '#2d6a2d' }}>Đọc tiếp →</div>
            </div>
          </div>
        </Link>

        {/* Other articles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {ARTICLES.slice(1).map(a => (
            <Link key={a.id} href={`/articles/${a.id}`} className="article-card">
              <div style={{ background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>
                {a.img}
              </div>
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <span className="cat-tag">{a.category}</span>
                  <span style={{ fontSize: 11, color: '#aaa' }}>{a.readTime} đọc</span>
                </div>
                <h3 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 18, fontWeight: 600, color: '#1a1a0e', marginBottom: 8, lineHeight: 1.4 }}>{a.title}</h3>
                <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{a.excerpt}</p>
                <div style={{ marginTop: 14, fontSize: 13, fontWeight: 700, color: '#2d6a2d' }}>Đọc tiếp →</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}