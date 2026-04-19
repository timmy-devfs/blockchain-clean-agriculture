// app/layout.tsx — Root layout SSG với metadata SEO
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'BICAP — Truy xuất nguồn gốc nông sản blockchain',
    template: '%s | BICAP',
  },
  description: 'Truy xuất nguồn gốc nông sản Việt Nam tích hợp blockchain VeChainThor. Quét QR để biết hành trình từ nông trại đến tay bạn.',
  keywords: ['truy xuất nguồn gốc', 'blockchain nông nghiệp', 'VeChain', 'nông sản sạch', 'QR code thực phẩm'],
  openGraph: {
    title: 'BICAP — Blockchain trong nông nghiệp sạch',
    description: 'Quét QR để biết toàn bộ hành trình nông sản từ đất đến tay bạn. Xác thực bởi VeChainThor.',
    type: 'website',
    locale: 'vi_VN',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <style>{`* { box-sizing: border-box; } body { margin: 0; padding: 0; }`}</style>
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}