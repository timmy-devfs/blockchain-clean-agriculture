import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicNav } from '../../../components/PublicNav';
import { ARTICLES_INDEX, getArticleById, type ArticleBlock } from '../../../data/articles-content';

export function generateStaticParams() {
  return ARTICLES_INDEX.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const doc = getArticleById(id);
  if (!doc) return { title: 'Không tìm thấy | BICAP' };
  return {
    title: `${doc.title} | BICAP`,
    description: doc.title,
  };
}

function Block({ b }: { b: ArticleBlock }) {
  if (b.type === 'h2') {
    return (
      <h2 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 24, fontWeight: 700, color: '#1a1a0e', margin: '28px 0 12px' }}>
        {b.text}
      </h2>
    );
  }
  if (b.type === 'h3') {
    return (
      <h3 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1a1a0e', margin: '20px 0 10px' }}>
        {b.text}
      </h3>
    );
  }
  if (b.type === 'p') {
    return <p style={{ fontSize: 16, color: '#444', lineHeight: 1.85, marginBottom: 14 }}>{b.text}</p>;
  }
  if (b.type === 'ul' && b.items) {
    return (
      <ul style={{ margin: '12px 0 20px 20px', color: '#444', lineHeight: 1.85, fontSize: 15 }}>
        {b.items.map((item, i) => (
          <li key={i} style={{ marginBottom: 8 }}>
            {item}
          </li>
        ))}
      </ul>
    );
  }
  return null;
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = getArticleById(id);
  if (!doc) notFound();

  return (
    <main style={{ minHeight: '100vh', background: '#fafaf7' }}>
      <PublicNav active="articles" />

      <section style={{ background: 'linear-gradient(135deg, #1a3d1a, #2d6a2d)', padding: '40px 24px 36px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 10 }}>
            {doc.category} · {doc.date} · {doc.readTime} đọc
          </p>
          <h1 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>
            {doc.title}
          </h1>
        </div>
      </section>

      <article style={{ maxWidth: 720, margin: '0 auto', padding: '36px 24px 64px' }}>
        {doc.blocks.map((b, i) => (
          <Block key={i} b={b} />
        ))}

        <div style={{ marginTop: 40, paddingTop: 28, borderTop: '1px solid #e8e8d8', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/articles" style={{ fontWeight: 600, color: '#2d6a2d', textDecoration: 'none' }}>
            ← Tất cả bài viết
          </Link>
          <Link href="/huong-dan" style={{ fontWeight: 600, color: '#2d6a2d', textDecoration: 'none' }}>
            Hướng dẫn tra cứu QR
          </Link>
        </div>
      </article>

      <footer style={{ background: '#111', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>🌿 BICAP</div>
        <p style={{ fontSize: 13, color: '#555' }}>Blockchain Integration in Clean Agricultural Production · © 2026</p>
      </footer>
    </main>
  );
}
