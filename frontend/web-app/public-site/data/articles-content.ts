export type ArticleBlock = { type: 'h2' | 'h3' | 'p' | 'ul'; text?: string; items?: string[] };

export type ArticleDoc = {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  blocks: ArticleBlock[];
};

export const ARTICLES_INDEX: { id: string; title: string; excerpt: string; category: string; date: string; readTime: string; img: string }[] = [
  {
    id: 'a001',
    title: 'VeChainThor và cuộc cách mạng truy xuất nguồn gốc nông sản Việt Nam',
    excerpt:
      'Tìm hiểu cách công nghệ blockchain VeChainThor đang thay đổi cách người tiêu dùng tiếp cận thông tin về thực phẩm họ ăn mỗi ngày.',
    category: 'Blockchain',
    date: '15/04/2026',
    readTime: '5 phút',
    img: '⛓',
  },
  {
    id: 'a002',
    title: 'Gạo ST25 — Hành trình từ đồng ruộng Sóc Trăng đến bàn ăn toàn cầu',
    excerpt:
      'Câu chuyện về loại gạo được bình chọn ngon nhất thế giới và hành trình minh bạch hóa chuỗi cung ứng bằng công nghệ số.',
    category: 'Câu chuyện sản phẩm',
    date: '10/04/2026',
    readTime: '4 phút',
    img: '🌾',
  },
  {
    id: 'a003',
    title: '5 lý do người tiêu dùng nên quan tâm đến QR Code trên bao bì thực phẩm',
    excerpt:
      'Không phải mọi QR đều như nhau. Chúng tôi giải thích tại sao QR blockchain khác biệt và mang lại giá trị thực sự cho người mua.',
    category: 'Hướng dẫn',
    date: '05/04/2026',
    readTime: '3 phút',
    img: '📱',
  },
  {
    id: 'a004',
    title: 'Nông nghiệp sạch và IoT: Cảm biến thông minh theo dõi từng giai đoạn sinh trưởng',
    excerpt:
      'Hệ thống IoT của BICAP ghi nhận nhiệt độ, độ ẩm, pH đất theo thời gian thực — toàn bộ được đưa lên blockchain.',
    category: 'Công nghệ',
    date: '01/04/2026',
    readTime: '6 phút',
    img: '🌡',
  },
];

const DOCS: Record<string, ArticleDoc> = {
  a001: {
    id: 'a001',
    title: ARTICLES_INDEX[0].title,
    category: ARTICLES_INDEX[0].category,
    date: ARTICLES_INDEX[0].date,
    readTime: ARTICLES_INDEX[0].readTime,
    blocks: [
      { type: 'p', text: 'VeChainThor là nền tảng blockchain công khai phù hợp với ứng dụng doanh nghiệp: chi phí hợp lý, tốc độ xác nhận nhanh và khả năng lưu trữ dữ liệu minh bạch, không thể sửa đổi ngược thời gian.' },
      { type: 'h2', text: 'Vì sao truy xuất nguồn gốc cần blockchain?' },
      { type: 'p', text: 'Thông tin truy xuất truyền thống thường nằm trên máy chủ của một bên — nếu dữ liệu bị chỉnh sửa, người mua khó kiểm chứng. Khi ghi nhận lên blockchain, mỗi bản ghi được liên kết mật mã với giao dịch trước; thay đổi nội dung sẽ để lại dấu vết rõ ràng.' },
      { type: 'h3', text: 'Lợi ích cho người tiêu dùng' },
      {
        type: 'ul',
        items: [
          'Xem được thông tin lô hàng, nông trại, chứng nhận trên một trang công khai.',
          'Mã giao dịch (transaction) có thể đối chiếu trên VeChain Explorer.',
          'Không cần tài khoản — quét QR hoặc nhập mã là tra cứu được.',
        ],
      },
      { type: 'h2', text: 'BICAP áp dụng như thế nào?' },
      { type: 'p', text: 'Hệ thống BICAP (bản demo web public) hiển thị thông tin nông trại, giới thiệu sản phẩm, nguồn gốc và một mã giao dịch mẫu gắn với lô hàng. Trong triển khai thực tế, các sự kiện thu hoạch, kiểm định, vận chuyển sẽ được đẩy lên chuỗi theo quy trình đã thống nhất.' },
    ],
  },
  a002: {
    id: 'a002',
    title: ARTICLES_INDEX[1].title,
    category: ARTICLES_INDEX[1].category,
    date: ARTICLES_INDEX[1].date,
    readTime: ARTICLES_INDEX[1].readTime,
    blocks: [
      { type: 'p', text: 'Gạo ST25 là thương hiệu gạo thơm nổi tiếng của vùng Đồng bằng sông Cửu Long, được canh tác trên phù sa và chăm sóc theo mùa vụ rõ ràng.' },
      { type: 'h2', text: 'Chuỗi giá trị từ ruộng đến xuất khẩu' },
      { type: 'p', text: 'Một lô gạo đi qua nhiều bước: thu hoạch, làm khô, xay xát, đóng bao, kiểm nghiệm, vận chuyển và phân phối. Truy xuất nguồn gốc giúp người mua biết lô hàng thuộc vụ mùa nào, từ vùng nào, và đã qua kiểm định ra sao.' },
      { type: 'h3', text: 'QR trên bao bì' },
      { type: 'p', text: 'Trên trang chủ BICAP, bạn có thể mở mục Sản phẩm, chọn gạo ST25 (hoặc mã SP001 trong dữ liệu demo) để xem trang truy xuất chi tiết: thông tin nông trại, giới thiệu, nguồn gốc và liên kết blockchain mẫu.' },
    ],
  },
  a003: {
    id: 'a003',
    title: ARTICLES_INDEX[2].title,
    category: ARTICLES_INDEX[2].category,
    date: ARTICLES_INDEX[2].date,
    readTime: ARTICLES_INDEX[2].readTime,
    blocks: [
      { type: 'p', text: 'QR trên bao bì có thể chỉ dẫn tới website quảng cáo, hoặc tới hệ thống truy xuất có dữ liệu kiểm chứng được. BICAP hướng tới loại thứ hai.' },
      { type: 'h2', text: 'Năm lý do nên quan tâm' },
      {
        type: 'ul',
        items: [
          'Minh bạch nguồn gốc — biết hàng đến từ đâu, lô nào.',
          'An tâm hơn khi có thông tin chứng nhận và lịch sử cập nhật.',
          'Hỗ trợ nông dân và nhà sản xuất chân chính có thể chứng minh chất lượng.',
          'Giảm hàng giả, hàng nhái nhãn mác nguồn gốc.',
          'Dễ tra cứu: chỉ cần điện thoại quét QR hoặc nhập mã trên trang Tra cứu.',
        ],
      },
      { type: 'h2', text: 'Cách tra cứu trên BICAP' },
      { type: 'p', text: 'Vào trang Hướng dẫn tra cứu trên menu, hoặc dùng ô tìm kiếm ở trang chủ nhập mã lô (ví dụ LH0001-F32L, SP001, DEMO). Hệ thống chuyển bạn tới trang chi tiết truy xuất.' },
    ],
  },
  a004: {
    id: 'a004',
    title: ARTICLES_INDEX[3].title,
    category: ARTICLES_INDEX[3].category,
    date: ARTICLES_INDEX[3].date,
    readTime: ARTICLES_INDEX[3].readTime,
    blocks: [
      { type: 'p', text: 'Cảm biến IoT ghi nhận điều kiện môi trường theo thời gian thực: nhiệt độ nhà kính, độ ẩm đất, lượng nước tưới… Dữ liệu này khi được đồng bộ và băm lên blockchain sẽ tăng độ tin cậy cho toàn chuỗi.' },
      { type: 'h2', text: 'Từ dữ liệu cảm biến đến người mua' },
      { type: 'p', text: 'Trong kiến trúc tổng thể BICAP, farm-service và iot-service thu thập sự kiện; các mốc quan trọng có thể được neo (anchor) lên VeChainThor. Giao diện web public tập trung hiển thị thông tin dễ đọc cho người không chuyên kỹ thuật.' },
      { type: 'h3', text: 'Demo hiện tại' },
      { type: 'p', text: 'Bản web public bạn đang xem là kênh tra cứu công khai: kết hợp dữ liệu mẫu và (khi có) dữ liệu lô thật đồng bộ từ ứng dụng vận hành nội bộ.' },
    ],
  },
};

export function getArticleById(id: string): ArticleDoc | null {
  const key = id.toLowerCase();
  return DOCS[key] ?? null;
}
