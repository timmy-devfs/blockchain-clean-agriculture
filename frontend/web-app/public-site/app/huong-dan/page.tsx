import Link from 'next/link';
import { Metadata } from 'next';
import { PublicNav } from '../../components/PublicNav';

export const metadata: Metadata = {
  title: 'Hướng dẫn tra cứu QR & mã lô | BICAP',
  description: 'Cách nhập mã trên trang chủ, dùng mã DEMO, mở sản phẩm từ danh mục và hiểu nội dung trang truy xuất.',
};

const STEPS = [
  {
    title: 'Cách 1: Ô tra cứu trên trang chủ',
    lines: [
      'Mở trang chủ BICAP, tìm ô “Tra cứu” trong phần hero.',
      'Nhập mã lô hoặc mã sản phẩm (ví dụ: SP001, LH0001-F32L, DEMO).',
      'Bấm nút “Tra cứu” — trình duyệt chuyển tới trang chi tiết truy xuất.',
    ],
  },
  {
    title: 'Cách 2: Từ danh mục sản phẩm',
    lines: [
      'Vào menu “Sản phẩm”.',
      'Mỗi thẻ có QR riêng trỏ đúng trang truy xuất của mã đó — có thể chụp màn hình QR để in tem hoặc gửi cho khách.',
      'Bấm thẻ hoặc “Xem nguồn gốc” để mở trang chi tiết; có thể lọc theo loại (Ngũ cốc, Trái cây, …).',
    ],
  },
  {
    title: 'Cách 3: Xem ví dụ (dành cho khách chưa có sản phẩm)',
    lines: [
      'Trên menu, bấm “Xem ví dụ tra cứu” (hoặc “Xem ví dụ (không cần QR thật)” ở cuối trang chủ).',
      'Không cần camera hay ảnh QR — trình duyệt mở sẵn một lô mẫu (mã DEMO) để bạn xem đủ các mục: nông trại, nguồn gốc, blockchain.',
      'Khi đã có hàng thật: quét QR trên bao bì hoặc gõ đúng mã in trên sản phẩm vào ô tra cứu.',
    ],
  },
];

const ON_PAGE = [
  'Thông tin nông trại: tên trại, địa điểm, chủ trại, ngày thu hoạch, số chứng nhận.',
  'Nguồn gốc & giới thiệu sản phẩm: mô tả lô hàng và vùng trồng/sản xuất.',
  'Blockchain: mã giao dịch mẫu và liên kết tới VeChain Explorer (để đối chiếu khi triển khai thật).',
];

export default function HuongDanPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#fafaf7', color: '#1a1a0e' }}>
      <PublicNav active="guide" />

      <header style={{ background: 'linear-gradient(135deg, #2d6a2d, #4a8c4a)', padding: '48px 24px 40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 700, color: '#fff', marginBottom: 12 }}>
            Hướng dẫn tra cứu
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.78)', lineHeight: 1.75 }}>
            Trang public chỉ để <strong>đọc và tra cứu</strong>. Bạn không cần tài khoản. Dùng mã có sẵn trong dự án hoặc mã lô được đồng bộ từ hệ thống vận hành.
          </p>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 72px' }}>
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Các bước tra cứu</h2>
          <div style={{ display: 'grid', gap: 20 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e8e8d8', borderRadius: 14, padding: '22px 22px' }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a3d1a', marginBottom: 12 }}>{s.title}</h3>
                <ol style={{ margin: 0, paddingLeft: 20, color: '#444', lineHeight: 1.85, fontSize: 15 }}>
                  {s.lines.map((line, j) => (
                    <li key={j} style={{ marginBottom: 6 }}>
                      {line}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 22, fontWeight: 700, marginBottom: 14 }}>Trên trang truy xuất có gì?</h2>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#444', lineHeight: 1.85, fontSize: 15 }}>
            {ON_PAGE.map((line, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: 14, padding: '22px 24px', marginBottom: 36 }}>
          <h2 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#1a3d1a' }}>
            Gợi ý mã để thử
          </h2>
          <p style={{ fontSize: 15, color: '#2d4a2d', lineHeight: 1.75, marginBottom: 10 }}>
            <strong>DEMO</strong> — xem lô mẫu. <strong>SP001</strong> … <strong>SP010</strong> — sản phẩm demo. <strong>LH…</strong> — nếu file đồng bộ lô có mã tương ứng, trang sẽ hiển thị dữ liệu thật.
          </p>
          <Link href="/trace/DEMO" style={{ fontWeight: 700, color: '#1a3d1a' }}>
            Mở tra cứu DEMO ngay →
          </Link>
        </section>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/how-it-works" style={{ fontWeight: 600, color: '#2d6a2d', textDecoration: 'none', borderBottom: '2px solid #2d6a2d' }}>
            Đọc thêm: Cách hoạt động
          </Link>
          <Link href="/products" style={{ fontWeight: 600, color: '#2d6a2d', textDecoration: 'none', borderBottom: '2px solid #2d6a2d' }}>
            Danh sách sản phẩm
          </Link>
          <Link href="/" style={{ fontWeight: 600, color: '#666', textDecoration: 'none' }}>
            ← Trang chủ
          </Link>
        </div>
      </div>

      <footer style={{ background: '#111', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>🌿 BICAP</div>
        <p style={{ fontSize: 13, color: '#555' }}>Blockchain Integration in Clean Agricultural Production · © 2026</p>
      </footer>
    </main>
  );
}
