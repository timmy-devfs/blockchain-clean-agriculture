import Link from 'next/link';
import { Metadata } from 'next';
import { PublicNav } from '../../components/PublicNav';

export const metadata: Metadata = {
  title: 'Cách hoạt động — Truy xuất nguồn gốc BICAP',
  description:
    'Quy trình từ nông trại, ghi nhận dữ liệu, blockchain VeChainThor đến người tiêu dùng quét QR. Hướng dẫn đầy đủ từng bước.',
};

const STEPS = [
  {
    n: '01',
    title: 'Thu thập tại nông trại',
    body:
      'Thông tin mùa vụ, chăm sóc, thu hoạch và kiểm định được ghi nhận theo lô. Mỗi lô có mã định danh (ví dụ SP001 cho sản phẩm mẫu, hoặc mã lô hàng vận chuyển LHxxxx) để đồng bộ xuyên suốt hệ thống.',
  },
  {
    n: '02',
    title: 'Neo dữ liệu & chứng thực',
    body:
      'Các mốc quan trọng có thể được ánh xạ lên blockchain VeChainThor: tạo giao dịch, lưu hash hoặc metadata công khai. Đặc điểm nổi bật là dữ liệu đã ghi không thể thay đổi ngược thời gian — phù hợp cho truy xuất nguồn gốc và kiểm toán.',
  },
  {
    n: '03',
    title: 'Tra cứu công khai',
    body:
      'Người tiêu dùng quét QR trên bao bì hoặc mở trang BICAP, nhập mã lô / mã sản phẩm vào ô tra cứu. Không cần đăng nhập. Trang chi tiết hiển thị thông tin nông trại, giới thiệu & nguồn gốc, và liên kết tới VeChain Explorer để đối chiếu giao dịch.',
  },
];

const FAQ = [
  {
    q: 'Tôi không có mã QR thật thì xem thử như thế nào?',
    a: 'Bấm “Xem ví dụ tra cứu” trên menu (mở lô mẫu DEMO) hoặc vào Sản phẩm và chọn một mặt hàng để xem trang truy xuất tương tự khi quét QR thật.',
  },
  {
    q: 'Dữ liệu “lô hàng thật” lấy từ đâu?',
    a: 'Khi bạn dùng hệ thống vận hành nội bộ (ứng dụng shipping) và đồng bộ đơn hàng, web public có thể đọc cùng file dữ liệu lô để hiển thị trên trang tra cứu. Nếu không có lô thật, hệ thống dùng danh sách sản phẩm demo (SP001…).',
  },
  {
    q: 'Blockchain có thay thế kiểm định thực tế không?',
    a: 'Blockchain là lớp chứng thực số và minh bạch hóa timeline. Kiểm định vật lý (an toàn thực phẩm, chất lượng) vẫn do quy trình và bên thứ ba đảm nhiệm; blockchain giúp dữ liệu đã công bố khó bị sửa chữa lén lút.',
  },
];

export default function HowItWorksPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#fafaf7', color: '#1a1a0e' }}>
      <PublicNav active="how" />

      <header style={{ background: 'linear-gradient(160deg, #1a3d1a 0%, #2d6a2d 55%, #4a8c4a 100%)', padding: '56px 24px 48px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#a8d5a8', marginBottom: 14 }}>Minh bạch · VeChainThor</p>
        <h1 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 'clamp(28px, 4.5vw, 44px)', fontWeight: 700, color: '#fff', maxWidth: 720, margin: '0 auto 16px', lineHeight: 1.2 }}>
          Cách hoạt động của BICAP
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.78)', maxWidth: 640, margin: '0 auto', lineHeight: 1.75 }}>
          Từ ruộng vườn đến bàn ăn: dữ liệu được tổ chức theo lô, hiển thị công khai trên web tra cứu, có thể neo lên blockchain để tăng độ tin cậy.
        </p>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 72px' }}>
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 26, fontWeight: 700, marginBottom: 16 }}>Tổng quan luồng</h2>
          <p style={{ fontSize: 16, color: '#444', lineHeight: 1.85, marginBottom: 12 }}>
            <strong>Nông trại / đơn vị sản xuất</strong> tạo hoặc cập nhật thông tin lô hàng trên hệ thống vận hành. <strong>Web public</strong> (trang bạn đang xem) là lớp dành cho người tiêu dùng: chỉ đọc và tra cứu, không chỉnh sửa dữ liệu nguồn.
          </p>
          <p style={{ fontSize: 16, color: '#444', lineHeight: 1.85 }}>
            Mã tra cứu có thể là <strong>mã sản phẩm demo</strong> (SP001…), <strong>mã lô vận chuyển</strong> (LH…), hoặc từ khóa <strong>DEMO</strong> để xem ví dụ minh họa.
          </p>
        </section>

        <div style={{ display: 'grid', gap: 22 }}>
          {STEPS.map((s) => (
            <section
              key={s.n}
              style={{
                background: '#fff',
                border: '1px solid #e8e8d8',
                borderRadius: 16,
                padding: '28px 26px',
                position: 'relative',
              }}
            >
              <span style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 44, fontWeight: 700, color: '#ede9d8', position: 'absolute', top: 12, right: 18 }}>
                {s.n}
              </span>
              <h3 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
              <p style={{ fontSize: 15, color: '#555', lineHeight: 1.8 }}>{s.body}</p>
            </section>
          ))}
        </div>

        <section style={{ marginTop: 56 }}>
          <h2 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 26, fontWeight: 700, marginBottom: 20 }}>Câu hỏi thường gặp</h2>
          <div style={{ display: 'grid', gap: 16 }}>
            {FAQ.map((f, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e8e8d8', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontWeight: 700, marginBottom: 8, color: '#1a3d1a' }}>{f.q}</div>
                <div style={{ fontSize: 15, color: '#555', lineHeight: 1.75 }}>{f.a}</div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ marginTop: 48, display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/huong-dan" style={{ display: 'inline-block', background: '#2d6a2d', color: '#fff', padding: '14px 26px', borderRadius: 50, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
            Hướng dẫn tra cứu QR
          </Link>
          <Link href="/products" style={{ display: 'inline-block', border: '2px solid #2d6a2d', color: '#2d6a2d', padding: '12px 24px', borderRadius: 50, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
            Xem danh sách sản phẩm
          </Link>
          <Link href="/" style={{ display: 'inline-block', color: '#2d6a2d', fontWeight: 600, textDecoration: 'none', padding: '14px 12px' }}>
            ← Về trang chủ
          </Link>
        </div>
      </div>

      <footer style={{ background: '#111', padding: '36px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>🌿 BICAP</div>
        <p style={{ fontSize: 13, color: '#555' }}>Blockchain Integration in Clean Agricultural Production · © 2026</p>
      </footer>
    </main>
  );
}
