// frontend/web-app/public-site/data/public-trace-demo.ts
// Ưu tiên đọc lô hàng thật từ shared/orders.json
// Fallback sang demo nếu không tìm thấy

import fs from 'fs';
import path from 'path';
import { PUBLIC_PRODUCT_IMAGE_OVERRIDES } from './public-product-images';

export interface TraceData {
  id: string;
  productName: string;
  farmName: string;
  farmLocation: string;
  farmOwner: string;
  harvestDate: string;
  certNo: string;
  blockchainTxId: string;
  status: string;
  productIntro?: string;
  originDetail?: string;
  timeline: { time: string; label: string; desc: string; icon: string }[];
}

export type ProductCatalogRow = {
  id: string; name: string; farm: string; origin: string;
  type: string; cert: boolean; img: string; color: string; desc: string;
  imageUrl?: string;
};

const PRODUCT_ORIGIN_COPY: Record<string, { intro: string; origin: string }> = {
  SP001: {
    intro: 'Gạo ST25 được canh tác theo quy trình giảm phát thải, thu hoạch đúng độ chín và xay xát theo lô để giữ hương thơm tự nhiên.',
    origin: 'Nguồn gốc từ Sóc Trăng, vùng đất phù sa ven biển; quy trình gieo trồng - thu hoạch - đóng gói được ghi nhận tuần tự theo từng lô.',
  },
  SP002: {
    intro: 'Cà phê Arabica được trồng ở vùng cao mát, thu hái chọn lọc quả chín và sơ chế sạch để đảm bảo hương vị ổn định.',
    origin: 'Nguồn gốc từ Lâm Đồng, canh tác tại cao nguyên Đà Lạt; dữ liệu sơ chế và đóng gói được lưu vết xuyên suốt.',
  },
  SP003: {
    intro: 'Rau sạch VietGAP trồng trong nhà kính, kiểm soát nước tưới và phân bón theo từng giai đoạn sinh trưởng.',
    origin: 'Nguồn gốc từ Đà Lạt; lô rau được theo dõi từ gieo trồng, chăm sóc đến thu hoạch và phân phối.',
  },
  SP004: {
    intro: 'Thanh long ruột đỏ được tuyển trái đạt chuẩn kích cỡ, xử lý sau thu hoạch để giữ độ tươi và màu sắc tự nhiên.',
    origin: 'Nguồn gốc từ Bình Thuận, vùng trồng chuyên canh thanh long; thông tin mùa vụ và đóng gói được chuẩn hóa theo mã lô.',
  },
  SP005: {
    intro: 'Mật ong rừng được thu hoạch theo mùa hoa, lọc thô tự nhiên và đóng chai theo tiêu chuẩn an toàn thực phẩm.',
    origin: 'Nguồn gốc từ Đắk Lắk; quy trình khai thác - kiểm định - đóng gói được gắn mã truy xuất riêng cho từng đợt.',
  },
  SP006: {
    intro: 'Xoài cát Hòa Lộc được chăm sóc theo tiêu chuẩn chất lượng cao, thu hái thủ công và chọn lọc theo độ đường.',
    origin: 'Nguồn gốc từ Tiền Giang; sản phẩm được lưu vết từ vườn trồng, sơ tuyển đến phân phối bán lẻ.',
  },
  SP007: {
    intro: 'Bưởi da xanh được canh tác theo hướng hữu cơ, chăm trái theo chu kỳ để đảm bảo vị ngọt và tép mọng.',
    origin: 'Nguồn gốc từ Bến Tre; từng lô bưởi có nhật ký chăm sóc và kiểm tra chất lượng trước khi xuất kho.',
  },
  SP008: {
    intro: 'Hạt điều rang muối sử dụng nguyên liệu điều tuyển chọn, chế biến nhiệt độ chuẩn để giữ độ giòn và vị béo.',
    origin: 'Nguồn gốc từ Bình Phước, vùng nguyên liệu điều trọng điểm; quy trình chế biến và đóng gói được theo dõi theo lô.',
  },
  SP009: {
    intro: 'Khoai lang tím Nhật được trồng trên đất phù hợp, thu hoạch đúng tuổi củ và xử lý làm sạch trước bảo quản.',
    origin: 'Nguồn gốc từ Vĩnh Long; dữ liệu canh tác và thu hoạch được liên kết với mã truy xuất của sản phẩm.',
  },
  SP010: {
    intro: 'Chè Shan Tuyết được hái thủ công từ vùng núi cao, chế biến truyền thống để giữ hương thơm và hậu vị đặc trưng.',
    origin: 'Nguồn gốc từ Hà Giang; quá trình thu hái - sao chè - đóng gói được ghi nhận theo từng mẻ sản xuất.',
  },
  'LH0001-F32L': {
    intro: 'Lô gạo thương phẩm được đóng gói theo chuẩn vận chuyển nội địa, đảm bảo truy xuất xuyên suốt trước khi bàn giao.',
    origin: 'Nguồn gốc từ HCM, sản xuất tại nông trại BCV và vận hành bởi tài xế mt theo quy trình số hóa của AgriChain.',
  },
  'LH0002-KNW8': {
    intro: 'Lô lúa sau sơ chế được đóng bao theo định mức, bảo quản phù hợp để duy trì chất lượng trong vận chuyển.',
    origin: 'Nguồn gốc từ Cần Thơ, sản xuất tại MNZ; dữ liệu lô hàng và chứng nhận được liên kết bằng mã QR riêng.',
  },
  'LH0003-0BAZ': {
    intro: 'Lô chè được kiểm soát ở khâu đóng gói và ghi nhận trạng thái theo từng lần cập nhật trên hệ thống.',
    origin: 'Nguồn gốc từ An Giang, sản xuất tại nông trại qưe; thông tin vận hành được cập nhật bởi đơn vị phụ trách mt.',
  },
};

// ── Đọc lô hàng thật từ shared JSON ─────────────────────────────────────────
function readRealOrders(): any[] {
  try {
    // Sau khi merge web-shipping vào web-app, dữ liệu sync orders nằm chung
    // /tmp/bicap-shared-orders.json (xem app/api/sync-orders/route.ts).
    const filePath = process.env.SHARED_ORDERS_PATH ?? '/tmp/bicap-shared-orders.json';
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) ?? [];
  } catch {
    return [];
  }
}

// Convert lô hàng thật (từ shipping module) → TraceData cho public routes
function realOrderToTraceData(order: any): TraceData {
  // Map status sang tiếng Việt thân thiện
  const statusMap: Record<string, string> = {
    'Đang vận chuyển': 'Đang vận chuyển',
    'Đã giao': 'Đã giao',
    'Chờ xử lý': 'Đang chuẩn bị',
    'Đang chuẩn bị': 'Đang chuẩn bị',
    'Hủy': 'Đã hủy',
  };

  // Build timeline từ timeline của lô hàng + thêm icon
  const iconMap: Record<string, string> = {
    'Đã tạo lô hàng':     '📦',
    'Chờ xử lý':          '⏳',
    'Đang vận chuyển':    '🚚',
    'Đã giao':            '✅',
    'Hủy':                '❌',
  };

  const timeline = (order.timeline ?? []).map((t: any) => {
    const normalizedLabel = statusMap[t.label] ?? t.label;
    return ({
    time: t.time,
    label: normalizedLabel,
    desc: t.desc,
    icon: iconMap[t.label] ?? iconMap[normalizedLabel] ?? '📋',
    });
  });

  // Fake blockchain tx từ order id (consistent)
  function fakeTx(seed: string): string {
    let x = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      x ^= seed.charCodeAt(i);
      x = Math.imul(x, 16777619) >>> 0;
    }
    let hex = '';
    for (let i = 0; i < 40; i++) {
      x = (Math.imul(x, 1103515245) + 12345) >>> 0;
      hex += (x % 16).toString(16);
    }
    return `0x${hex}`;
  }

  const orderId = String(order.id || '').toUpperCase();
  const copy = PRODUCT_ORIGIN_COPY[orderId];

  return {
    id: order.id,
    productName: order.cargo || 'Hàng hóa',
    farmName: order.farm || 'Nông trại AgriChain',
    farmLocation: order.from || 'Việt Nam',
    farmOwner: order.driver || 'AgriChain',
    harvestDate: order.date || order.createdAt || '—',
    certNo: `AGRI-${order.id}`,
    blockchainTxId: fakeTx(order.id),
    status: statusMap[order.status] ?? order.status,
    productIntro:
      copy?.intro ||
      order.note?.trim() ||
      `${order.cargo || 'Sản phẩm'} được quản lý minh bạch theo chuẩn truy xuất nguồn gốc của AgriChain.`,
    originDetail:
      copy?.origin ||
      `Nguồn gốc từ ${order.from || '—'}, sản xuất tại ${order.farm || 'nông trại AgriChain'}, đơn vị phụ trách: ${order.driver || 'AgriChain'}.`,
    timeline: timeline.length > 0 ? timeline : [
      { time: order.createdAt, label: 'Đã tạo lô hàng', desc: 'Lô hàng được tạo trên hệ thống AgriChain.', icon: '📦' },
    ],
  };
}

// ── Demo catalog (fallback) ───────────────────────────────────────────────────
export const PUBLIC_PRODUCTS: ProductCatalogRow[] = [
  { id: 'SP001', name: 'Gạo ST25 Sóc Trăng', farm: 'Farm Mekong Delta', origin: 'Sóc Trăng', type: 'Ngũ cốc', cert: true, img: '🌾', color: '#e8f5e9, #c8e6c9', desc: 'Gạo thơm đặc sản, đạt giải gạo ngon nhất thế giới 5 năm liên tiếp.' },
  { id: 'SP004', name: 'Thanh long ruột đỏ', farm: 'Dragon Fruit Farm', origin: 'Bình Thuận', type: 'Trái cây', cert: true, img: '🐉', color: '#fce7f3, #fbcfe8', desc: 'Thanh long xuất khẩu, đạt tiêu chuẩn GlobalGAP.' },
  { id: 'SP003', name: 'Rau sạch VietGAP', farm: 'Green House Farm', origin: 'Đà Lạt', type: 'Rau củ', cert: true, img: '🥬', color: '#dcfce7, #bbf7d0', desc: 'Rau trồng trong nhà kính, không thuốc trừ sâu.' },
  { id: 'SP002', name: 'Cà phê Arabica Đà Lạt', farm: 'Highland Coffee Farm', origin: 'Lâm Đồng', type: 'Đồ uống', cert: true, img: '☕', color: '#fef3c7, #fde68a', desc: 'Cà phê cao nguyên trồng ở độ cao 1500m.' },
  { id: 'SP005', name: 'Mật ong rừng Tây Nguyên', farm: 'Bee Natural Farm', origin: 'Đắk Lắk', type: 'Đặc sản', cert: true, img: '🍯', color: '#fff7ed, #fed7aa', desc: 'Mật ong khai thác từ rừng nguyên sinh Tây Nguyên.' },
  { id: 'SP006', name: 'Xoài cát Hòa Lộc', farm: 'Mango King Farm', origin: 'Tiền Giang', type: 'Trái cây', cert: true, img: '🥭', color: '#fefce8, #fde047', desc: 'Xoài cát ngọt thanh, truy xuất đầy đủ từ vườn đến đóng gói.' },
  { id: 'SP007', name: 'Bưởi da xanh Bến Tre', farm: 'Ben Tre Citrus Farm', origin: 'Bến Tre', type: 'Trái cây', cert: true, img: '🍈', color: '#ecfccb, #bef264', desc: 'Bưởi da xanh canh tác theo hướng hữu cơ, đạt chuẩn an toàn.' },
  { id: 'SP008', name: 'Hạt điều rang muối', farm: 'Cashew Highlands Farm', origin: 'Bình Phước', type: 'Đặc sản', cert: true, img: '🥜', color: '#fff1e6, #fed7aa', desc: 'Hạt điều tuyển chọn, sơ chế sạch và đóng gói truy xuất QR.' },
  { id: 'SP009', name: 'Khoai lang tím Nhật', farm: 'Purple Root Farm', origin: 'Vĩnh Long', type: 'Rau củ', cert: true, img: '🍠', color: '#f3e8ff, #d8b4fe', desc: 'Khoai lang tím chất lượng cao, bảo quản lạnh theo tiêu chuẩn.' },
  { id: 'SP010', name: 'Chè Shan Tuyết', farm: 'High Mountain Tea Farm', origin: 'Hà Giang', type: 'Đồ uống', cert: true, img: '🍵', color: '#ecfdf5, #a7f3d0', desc: 'Chè cổ thụ vùng cao, thu hái thủ công và chế biến truyền thống.' },
];

function realOrderToProductRow(order: any): ProductCatalogRow {
  const typeGuess =
    /gạo|lúa|ngũ cốc/i.test(order.cargo || '') ? 'Ngũ cốc' :
    /rau|củ/i.test(order.cargo || '') ? 'Rau củ' :
    /cam|xoài|chuối|bưởi|thanh long|trái/i.test(order.cargo || '') ? 'Trái cây' :
    /cà phê|trà|chè/i.test(order.cargo || '') ? 'Đồ uống' :
    'Đặc sản';
  return {
    id: order.id || `SP-${Math.random().toString(36).slice(2, 8)}`,
    name: order.cargo || 'Nông sản',
    farm: order.farm || 'Nông trại AgriChain',
    origin: order.from || 'Việt Nam',
    type: typeGuess,
    cert: order.status === 'Đã giao' || order.status === 'Đang vận chuyển',
    img: '🌿',
    color: '#e8f5e9, #c8e6c9',
    desc: order.note || `Lô hàng ${order.id} từ ${order.from || '—'} đến ${order.to || '—'}.`,
    imageUrl: PUBLIC_PRODUCT_IMAGE_OVERRIDES[String(order.id || '').toUpperCase()] || undefined,
  };
}

export function getPublicProducts(): ProductCatalogRow[] {
  const realOrders = readRealOrders();
  if (!realOrders.length) {
    return PUBLIC_PRODUCTS.map((p) => ({
      ...p,
      imageUrl: PUBLIC_PRODUCT_IMAGE_OVERRIDES[p.id.toUpperCase()] || p.imageUrl,
    }));
  }
  const realRows = realOrders
    .slice()
    .reverse()
    .map(realOrderToProductRow)
    .filter((p) => p.id && p.name);
  const used = new Set(realRows.map((p) => p.id.toUpperCase()));
  const demos = PUBLIC_PRODUCTS
    .filter((p) => !used.has(p.id.toUpperCase()))
    .map((p) => ({
      ...p,
      imageUrl: PUBLIC_PRODUCT_IMAGE_OVERRIDES[p.id.toUpperCase()] || p.imageUrl,
    }));
  return [...realRows, ...demos];
}

function fakeTxId(seed: string): string {
  let x = 2166136261;
  for (let i = 0; i < seed.length; i++) { x ^= seed.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; }
  let hex = '';
  for (let i = 0; i < 40; i++) { x = (Math.imul(x, 1103515245) + 12345) >>> 0; hex += (x % 16).toString(16); }
  return `0x${hex}`;
}

function buildDemoTrace(p: ProductCatalogRow, id: string): TraceData {
  const num = parseInt(p.id.replace(/\D/g, ''), 10) || 1;
  const copy = PRODUCT_ORIGIN_COPY[p.id.toUpperCase()];
  return {
    id,
    productName: p.name,
    farmName: p.farm,
    farmLocation: `${p.origin}, Việt Nam`,
    farmOwner: 'Nguyễn Văn An',
    harvestDate: `${10 + (num % 9)}/03/2026`,
    certNo: p.cert ? `VietGAP-2026-${String(400 + num).padStart(5, '0')}` : 'Đang cập nhật',
    blockchainTxId: fakeTxId(p.id + id),
    status: p.cert ? 'Đã giao' : 'Đang hoàn thiện',
    productIntro: copy?.intro || p.desc,
    originDetail:
      copy?.origin ||
      `${p.name} được nuôi trồng tại ${p.origin} theo quy trình kiểm soát chất lượng và lưu vết số hóa.`,
    timeline: [
      { time: '01/03/2026 06:00', label: 'Bắt đầu mùa vụ', desc: `Gieo trồng ${p.name} tại ${p.farm}.`, icon: '🌱' },
      { time: '10/03/2026 07:00', label: 'Thu hoạch', desc: 'Thu hoạch đạt năng suất, kiểm tra chất lượng.', icon: '🌾' },
      { time: '11/03/2026 15:00', label: 'Sơ chế & đóng gói', desc: 'Đóng bao và dán mã QR truy xuất blockchain.', icon: '📦' },
      { time: '12/03/2026 08:00', label: 'Vận chuyển', desc: 'Bàn giao cho đơn vị vận chuyển.', icon: '🚚' },
      { time: '14/03/2026 10:00', label: 'Giao hàng thành công', desc: 'Hàng đến điểm bán lẻ, khách quét QR xác minh.', icon: '✅' },
    ],
  };
}

// ── Main export ───────────────────────────────────────────────────────────────
export function getDemoTraceData(qrCode: string): TraceData | null {
  const code = qrCode.trim();
  if (!code) return null;
  const upper = code.toUpperCase();

  // 1. Ưu tiên tìm trong lô hàng THẬT từ shipping module
  const realOrders = readRealOrders();
  const realOrder = realOrders.find(
    (o: any) => o.id?.toUpperCase() === upper || o.id?.toUpperCase().includes(upper)
  );
  if (realOrder) return realOrderToTraceData(realOrder);

  // 2. Fallback: demo catalog SP001, SP002...
  if (upper.startsWith('SP')) {
    const p = PUBLIC_PRODUCTS.find(x => x.id.toUpperCase() === upper);
    if (p) return buildDemoTrace(p, code);
  }

  // 3. Fallback: DEMO hoặc LH không có trong shared → dùng mẫu gạo
  if (upper === 'DEMO' || upper.startsWith('LH')) {
    const base = PUBLIC_PRODUCTS.find(x => x.id === 'SP001')!;
    return buildDemoTrace(base, code);
  }

  return null;
}