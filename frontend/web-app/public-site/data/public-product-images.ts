// Cấu hình ảnh cho public routes (KHÔNG phụ thuộc shipping module).
// Cách dùng:
// 1) Bỏ ảnh vào: frontend/web-app/public/product-images/
// 2) Map theo mã sản phẩm/lô bên dưới, ví dụ: 'SP001': '/product-images/sp001.jpg'

export const PUBLIC_PRODUCT_IMAGE_OVERRIDES: Record<string, string> = {
  // Real orders
  'LH0001-F32L': '/product-images/gao.jpg',
  'LH0002-KNW8': '/product-images/lua.jpg',
  'LH0003-0BAZ': '/product-images/tra.jpg',

  // Demo products
  SP001: '/product-images/st25.jpg',
  SP002: '/product-images/cafe.jpg',
  SP003: '/product-images/vietgap.jpg',
  SP004: '/product-images/thanhlong.jpg',
  SP005: '/product-images/matong.png',
  SP006: '/product-images/xoai.jpg',
  SP007: '/product-images/buoi.jpg',
  SP008: '/product-images/hatdieu.jpg',
  SP009: '/product-images/khoai.jpg',
  SP010: '/product-images/cheshan.png',
};

