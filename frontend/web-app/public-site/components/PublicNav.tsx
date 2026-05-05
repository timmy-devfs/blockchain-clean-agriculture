import Link from 'next/link';

export type PublicNavActive = 'home' | 'how' | 'products' | 'articles' | 'guide';

type Props = { active?: PublicNavActive };

const navItem = (active: boolean) =>
  ({
    color: active ? '#2d6a2d' : '#3a3a2e',
    fontSize: 14,
    fontWeight: 500,
    textDecoration: 'none',
    padding: '6px 0',
    borderBottom: active ? '2px solid #2d6a2d' : '2px solid transparent',
    fontFamily: '"Be Vietnam Pro", sans-serif',
  }) as const;

export function PublicNav({ active }: Props) {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(250,250,247,.93)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid #e8e8d8',
      }}
    >
      <div
        style={{
          maxWidth: 1160,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 60,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🌿</span>
          <span style={{ fontFamily: 'Lora, Georgia, serif', fontWeight: 700, fontSize: 16, color: '#1a1a0e' }}>BICAP</span>
        </Link>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/how-it-works" style={navItem(active === 'how')}>
            Cách hoạt động
          </Link>
          <Link href="/products" style={navItem(active === 'products')}>
            Sản phẩm
          </Link>
          <Link href="/articles" style={navItem(active === 'articles')}>
            Tin tức
          </Link>
          <Link href="/huong-dan" style={navItem(active === 'guide')}>
            Hướng dẫn tra cứu
          </Link>
        </div>
      </div>
    </nav>
  );
}
