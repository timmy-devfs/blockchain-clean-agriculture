// frontend/web-public/data/public-trace-demo.ts
// Ưu tiên đọc lô hàng thật từ shared/orders.json
// Fallback sang demo nếu không tìm thấy

import fs from 'fs';
import path from 'path';

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
  timeline: { time: string; label: string; desc: string; icon: string }[];
}

export type ProductCatalogRow = {
  id: string; name: string; farm: string; origin: string;
  type: string; cert: boolean; img: string; color: string; desc: string;
};

// ── Đọc lô hàng thật từ shared JSON ─────────────────────────────────────────
function readRealOrders(): any[] {
  try {
    const filePath = path.resolve(process.cwd(), '..', 'shared', 'orders.json');
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) ?? [];
  } catch {
    return [];
  }
}

// Convert lô hàng thật (từ web-shipping) → TraceData cho web-public
function realOrderToTraceData(order: any): TraceData {
  // Map status sang tiếng Việt thân thiện
  const statusMap: Record<string, string> = {
    'Đang vận chuyển': 'Đang vận chuyển',
    'Đã giao': 'Đã giao',
    'Chờ xử lý': 'Chờ xử lý',
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

  const timeline = (order.timeline ?? []).map((t: any) => ({
    time: t.time,
    label: t.label,
    desc: t.desc,
    icon: iconMap[t.label] ?? '📋',
  }));

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
];

function fakeTxId(seed: string): string {
  let x = 2166136261;
  for (let i = 0; i < seed.length; i++) { x ^= seed.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; }
  let hex = '';
  for (let i = 0; i < 40; i++) { x = (Math.imul(x, 1103515245) + 12345) >>> 0; hex += (x % 16).toString(16); }
  return `0x${hex}`;
}

function buildDemoTrace(p: ProductCatalogRow, id: string): TraceData {
  const num = parseInt(p.id.replace(/\D/g, ''), 10) || 1;
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

  // 1. Ưu tiên tìm trong lô hàng THẬT từ web-shipping
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