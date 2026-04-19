// ═══════════════════════════════════════════════
// AgriChain — Shared Data & Constants
// Dùng chung cho tất cả packages
// ═══════════════════════════════════════════════

export const SERVICES = [
    { name: 'api-gateway',           port: 8080, status: 'up',   ping: 12  },
    { name: 'identity-service',      port: 8081, status: 'up',   ping: 8   },
    { name: 'farm-service',          port: 8082, status: 'up',   ping: 24  },
    { name: 'retailer-service',      port: 8083, status: 'up',   ping: 31  },
    { name: 'shipping-service',      port: 8084, status: 'warn', ping: 185 },
    { name: 'notification-service',  port: 8085, status: 'up',   ping: 15  },
    { name: 'payment-service',       port: 8086, status: 'up',   ping: 19  },
    { name: 'iot-service',           port: 8087, status: 'down', ping: null},
    { name: 'report-service',        port: 8088, status: 'up',   ping: 45  },
    { name: 'blockchain-service',    port: 8090, status: 'up',   ping: 62  },
  ];
  
  export const DRIVERS = [
    { name: 'Nguyễn Văn An',  code: 'NVA', color: 'da-green', route: 'Tiền Giang → Big C Q7',        pct: 78, status: 'Đang giao',  cargo: 'Xoài cát'      },
    { name: 'Trần Thị Bích',  code: 'TTB', color: 'da-blue',  route: 'Lâm Đồng → Coop Mart BD',      pct: 55, status: 'Đang giao',  cargo: 'Rau hữu cơ'    },
    { name: 'Lê Văn Cường',   code: 'LVC', color: 'da-amber', route: 'Long An → MM Mega Market',     pct: 90, status: 'Sắp đến',    cargo: 'Thanh long'    },
    { name: 'Phạm Thị Dung',  code: 'PTD', color: 'da-green', route: 'Cần Thơ → Lotte Đà Nẵng',     pct: 40, status: 'Đang giao',  cargo: 'Gạo ST25'      },
    { name: 'Hoàng Văn Em',   code: 'HVE', color: 'da-blue',  route: 'Long An → VinMart CT',         pct: 62, status: 'Đang giao',  cargo: 'Dưa hấu'       },
    { name: 'Lý Thị Phượng',  code: 'LTP', color: 'da-amber', route: 'Đồng Tháp → Nhà máy HCM',     pct: 20, status: 'Mới xuất phát', cargo: 'Lúa VietGAP' },
  ];
  
  export const KAFKA_TOPICS = [
    'farm.harvest.created',
    'shipping.order.updated',
    'payment.vnpay.callback',
    'identity.user.verified',
    'iot.sensor.alert',
    'blockchain.tx.confirmed',
    'retailer.qr.scanned',
  ];
  
  export const KAFKA_MESSAGES = [
    'Lô xoài cát Hòa Lộc — batch #B2024-0418',
    'Đơn #SHP-3847 → Big C Q7, HCM',
    'VNPay callback thành công — ₫420,000',
    'JWT token refreshed cho user #U-1182',
    'Cảnh báo nhiệt độ 38°C — sensor #S04',
    'TX 0x9a1f…d320 xác nhận trên VeChain',
    'QR scan tại Big C Q7 — Nguyễn Thị Mai',
  ];
  
  export const TX_DATA = [
    { hash: '0x3a4f…c1b2', farm: 'Nhà vườn Hòa An',    type: 'Thu hoạch',   cls: 'b-ok'     },
    { hash: '0x7e2a…9d44', farm: 'HTX Đà Lạt',          type: 'Vận chuyển',  cls: 'b-blue'   },
    { hash: '0xb81c…5f30', farm: 'Nông trại Sạch VN',   type: 'QR Scan',     cls: 'b-purple' },
    { hash: '0x2d9e…a17f', farm: 'Vietfarm Cần Thơ',    type: 'Phân phối',   cls: 'b-blue'   },
    { hash: '0x55f1…cc08', farm: 'HTX Long An',          type: 'Chứng nhận',  cls: 'b-ok'     },
  ];
  
  export const IOT_SENSORS = [
    { label: 'Nhiệt độ',   value: '28.4', unit: '°C',  pct: 57, cls: 'ib-ok',   trend: 'md-neutral', delta: 'Ổn định'     },
    { label: 'Độ ẩm',      value: '82',   unit: '%',   pct: 82, cls: 'ib-warn',  trend: 'md-down',    delta: '▼ Cao'       },
    { label: 'Ánh sáng',   value: '1,240',unit: 'lux', pct: 50, cls: 'ib-ok',   trend: 'md-up',      delta: '▲ Tốt'       },
    { label: 'pH đất',     value: '6.4',  unit: 'pH',  pct: 64, cls: 'ib-ok',   trend: 'md-neutral', delta: 'Bình thường' },
    { label: 'CO₂',        value: '412',  unit: 'ppm', pct: 41, cls: 'ib-ok',   trend: 'md-neutral', delta: 'An toàn'     },
    { label: 'Tốc độ gió', value: '3.2',  unit: 'm/s', pct: 32, cls: 'ib-ok',   trend: 'md-up',      delta: '▲ Nhẹ'       },
  ];
  
  export const FARMS = [
    { id: 'FM-001', name: 'Nhà vườn Hòa An',    region: 'Tiền Giang', product: 'Xoài cát Hòa Lộc',   cert: 'VietGAP',  certCls: 'b-ok',     status: 'Hoạt động',    statusCls: 'b-ok'     },
    { id: 'FM-002', name: 'HTX Đà Lạt',          region: 'Lâm Đồng',  product: 'Rau thủy canh',       cert: 'Hữu cơ',   certCls: 'b-blue',   status: 'Hoạt động',    statusCls: 'b-ok'     },
    { id: 'FM-003', name: 'Nông trại Sạch VN',   region: 'Long An',   product: 'Thanh long ruột đỏ',  cert: 'VietGAP',  certCls: 'b-ok',     status: 'Hoạt động',    statusCls: 'b-ok'     },
    { id: 'FM-004', name: 'Vietfarm Cần Thơ',    region: 'Cần Thơ',   product: 'Gạo ST25',            cert: 'GlobalGAP',certCls: 'b-purple', status: 'Đang kiểm tra',statusCls: 'b-pending'},
  ];
  
  export const SHIPMENTS = [
    { id: 'SHP-3847', farm: 'Nhà vườn Hòa An',  product: 'Xoài cát Hòa Lộc',    dest: 'Big C Q7, HCM',   driver: 'Nguyễn Văn A', tx: '0x3a4f…c1b2', status: 'Đã giao',   statusCls: 'b-ok'     },
    { id: 'SHP-3848', farm: 'HTX Đà Lạt',        product: 'Rau thủy canh hữu cơ', dest: 'Coop Mart BD',    driver: 'Trần Thị B',   tx: '0x7e2a…9d44', status: 'Đang giao', statusCls: 'b-pending'},
    { id: 'SHP-3849', farm: 'Nông trại Sạch VN', product: 'Thanh long ruột đỏ',  dest: 'MM Mega Market',  driver: 'Lê Văn C',     tx: '0xb81c…5f30', status: 'Đã giao',   statusCls: 'b-ok'     },
    { id: 'SHP-3850', farm: 'Vietfarm Cần Thơ',  product: 'Gạo ST25 hữu cơ',     dest: 'Lotte Đà Nẵng',  driver: 'Phạm Thị D',   tx: '0x2d9e…a17f', status: 'Đang giao', statusCls: 'b-pending'},
    { id: 'SHP-3851', farm: 'HTX Long An',        product: 'Dưa hấu không hạt',   dest: 'VinMart CT',      driver: 'Hoàng Văn E',  tx: '0x55f1…cc08', status: 'Trễ hạn',   statusCls: 'b-fail'   },
    { id: 'SHP-3852', farm: 'Cánh đồng Mẫu Lớn', product: 'Lúa VietGAP',         dest: 'Nhà máy xay HCM', driver: 'Lý Thị F',    tx: '0x9c3d…e281', status: 'Đang tải',  statusCls: 'b-blue'   },
  ];
  
  export const BLOCKCHAIN_TXS = [
    { hash: '0x3a4f…c1b2', block: '#18,204,441', farm: 'Nhà vườn Hòa An',  type: 'Thu hoạch',  typeCls: 'b-ok',     gas: '18 VTHO', time: '2 phút trước',  status: 'Confirmed', statusCls: 'b-ok'     },
    { hash: '0x7e2a…9d44', block: '#18,204,438', farm: 'HTX Đà Lạt',        type: 'Vận chuyển', typeCls: 'b-blue',   gas: '21 VTHO', time: '5 phút trước',  status: 'Confirmed', statusCls: 'b-ok'     },
    { hash: '0xb81c…5f30', block: '#18,204,435', farm: 'Nông trại Sạch VN', type: 'QR Scan',    typeCls: 'b-purple', gas: '14 VTHO', time: '8 phút trước',  status: 'Pending',   statusCls: 'b-pending'},
    { hash: '0x2d9e…a17f', block: '#18,204,430', farm: 'Vietfarm Cần Thơ',  type: 'Phân phối',  typeCls: 'b-blue',   gas: '22 VTHO', time: '15 phút trước', status: 'Confirmed', statusCls: 'b-ok'     },
    { hash: '0x55f1…cc08', block: '#18,204,421', farm: 'HTX Long An',        type: 'Chứng nhận', typeCls: 'b-ok',     gas: '19 VTHO', time: '28 phút trước', status: 'Failed',    statusCls: 'b-fail'   },
  ];