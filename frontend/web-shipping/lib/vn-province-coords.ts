/**
 * Tọa độ gần trung tâm hành chính từng tỉnh/thành (WGS84) — dùng fallback khi geocoding lỗi.
 * Khớp chính xác tên trong dropdown dashboard (VN_PROVINCES).
 */
export const VN_PROVINCE_COORDS: Record<string, [number, number]> = {
  'An Giang': [10.5216, 105.1259],
  'Bà Rịa - Vũng Tàu': [10.5417, 107.2429],
  'Bạc Liêu': [9.2864, 105.7218],
  'Bắc Giang': [21.2739, 106.1946],
  'Bắc Kạn': [22.147, 105.8348],
  'Bắc Ninh': [21.1214, 106.1111],
  'Bến Tre': [10.2434, 106.3757],
  'Bình Dương': [11.3254, 106.4774],
  'Bình Định': [13.7765, 109.2237],
  'Bình Phước': [11.7511, 106.7234],
  'Bình Thuận': [10.9289, 108.0991],
  'Cà Mau': [9.1526, 105.196],
  'Cao Bằng': [22.6663, 106.2525],
  'Cần Thơ': [10.0452, 105.7469],
  'Đà Nẵng': [16.0544, 108.2022],
  'Đắk Lắk': [12.6675, 108.0378],
  'Đắk Nông': [12.0096, 107.6839],
  'Điện Biên': [21.386, 103.023],
  'Đồng Nai': [10.9469, 106.834],
  'Đồng Tháp': [10.5142, 105.6329],
  'Gia Lai': [13.8079, 108.1094],
  'Hà Giang': [22.8026, 104.9784],
  'Hà Nam': [20.5835, 105.923],
  'Hà Nội': [21.0285, 105.8542],
  'Hà Tĩnh': [18.3433, 105.9053],
  'Hải Dương': [20.9373, 106.3146],
  'Hải Phòng': [20.8449, 106.6881],
  'Hậu Giang': [9.7579, 105.6413],
  'Hòa Bình': [20.8172, 105.3376],
  'Hưng Yên': [20.6464, 106.0513],
  'Khánh Hòa': [12.2388, 109.1967],
  'Kiên Giang': [10.0125, 105.0809],
  'Kon Tum': [14.3497, 108.0005],
  'Lai Châu': [22.3864, 103.9143],
  'Lạng Sơn': [21.8537, 106.761],
  'Lào Cai': [22.4856, 103.9706],
  'Lâm Đồng': [11.9465, 108.4419],
  'Long An': [10.6086, 106.1122],
  'Nam Định': [20.4388, 106.1621],
  'Nghệ An': [18.6796, 105.6813],
  'Ninh Bình': [20.2506, 105.9745],
  'Ninh Thuận': [11.5643, 108.9886],
  'Phú Thọ': [21.2689, 105.2045],
  'Phú Yên': [13.0882, 109.0929],
  'Quảng Bình': [17.4688, 106.6223],
  'Quảng Nam': [15.5394, 108.0191],
  'Quảng Ngãi': [15.1214, 108.8044],
  'Quảng Ninh': [21.0064, 107.2925],
  'Quảng Trị': [16.7403, 107.1854],
  'Sóc Trăng': [9.6025, 105.9739],
  'Sơn La': [21.3256, 103.9188],
  'Tây Ninh': [11.3351, 106.1099],
  'Thái Bình': [20.4463, 106.3366],
  'Thái Nguyên': [21.5672, 105.8252],
  'Thanh Hóa': [19.8067, 105.7851],
  'Thừa Thiên Huế': [16.4637, 107.5909],
  'Tiền Giang': [10.36, 106.3604],
  'TP. Hồ Chí Minh': [10.8231, 106.6297],
  'Trà Vinh': [9.9347, 106.3453],
  'Tuyên Quang': [21.8236, 105.214],
  'Vĩnh Long': [10.2397, 105.9571],
  'Vĩnh Phúc': [21.3609, 105.5474],
  'Yên Bái': [21.7167, 104.8986],
};

const KEYS = Object.keys(VN_PROVINCE_COORDS);

/** Alias: tất cả cách gọi tắt / không dấu / viết thường → tên chuẩn */
const PROVINCE_ALIASES: Record<string, string> = {
  // Hồ Chí Minh
  'hcm': 'TP. Hồ Chí Minh',
  'hồ chí minh': 'TP. Hồ Chí Minh',
  'tp hcm': 'TP. Hồ Chí Minh',
  'tp.hcm': 'TP. Hồ Chí Minh',
  'tphcm': 'TP. Hồ Chí Minh',
  'tp ho chi minh': 'TP. Hồ Chí Minh',
  'ho chi minh': 'TP. Hồ Chí Minh',
  'saigon': 'TP. Hồ Chí Minh',
  'sg': 'TP. Hồ Chí Minh',
  // Hà Nội
  'ha noi': 'Hà Nội',
  'hn': 'Hà Nội',
  'hanoi': 'Hà Nội',
  // Cần Thơ
  'can tho': 'Cần Thơ',
  'ct': 'Cần Thơ',
  // Bến Tre
  'ben tre': 'Bến Tre',
  'bt': 'Bến Tre',
  // Đà Nẵng
  'da nang': 'Đà Nẵng',
  'dn': 'Đà Nẵng',
  'danang': 'Đà Nẵng',
  // Hải Phòng
  'hai phong': 'Hải Phòng',
  'hp': 'Hải Phòng',
  // Huế
  'hue': 'Thừa Thiên Huế',
  'thua thien hue': 'Thừa Thiên Huế',
  // Khánh Hòa / Nha Trang
  'nha trang': 'Khánh Hòa',
  'khanh hoa': 'Khánh Hòa',
  'kh': 'Khánh Hòa',
  // Vũng Tàu
  'vung tau': 'Bà Rịa - Vũng Tàu',
  'ba ria vung tau': 'Bà Rịa - Vũng Tàu',
  'brvt': 'Bà Rịa - Vũng Tàu',
  // Bình Dương
  'binh duong': 'Bình Dương',
  'bd': 'Bình Dương',
  // Bình Thuận
  'binh thuan': 'Bình Thuận',
  // Đồng Nai
  'dong nai': 'Đồng Nai',
  // An Giang
  'an giang': 'An Giang',
  'ag': 'An Giang',
  // Tiền Giang
  'tien giang': 'Tiền Giang',
  'tg': 'Tiền Giang',
  // Long An
  'long an': 'Long An',
  'la': 'Long An',
  // Đắk Lắk
  'dak lak': 'Đắk Lắk',
  'dl': 'Đắk Lắk',
  // Lâm Đồng / Đà Lạt
  'lam dong': 'Lâm Đồng',
  'da lat': 'Lâm Đồng',
  'dalat': 'Lâm Đồng',
  // Nghệ An
  'nghe an': 'Nghệ An',
  // Thanh Hóa
  'thanh hoa': 'Thanh Hóa',
  // Quảng Ninh / Hạ Long
  'quang ninh': 'Quảng Ninh',
  'ha long': 'Quảng Ninh',
};

/** Chuẩn hóa chuỗi để so khớp tên tỉnh */
function norm(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Tìm tọa độ từ chuỗi địa chỉ (tên tỉnh đầy đủ / viết tắt / không dấu / chứa tên tỉnh).
 */
export function resolveProvinceCoords(address: string): [number, number] | null {
  const raw = address.trim();
  if (!raw) return null;

  // 1. Khớp chính xác tên tỉnh
  if (VN_PROVINCE_COORDS[raw]) return VN_PROVINCE_COORDS[raw];

  const n = norm(raw);

  // 2. Alias chính xác
  const viaAlias = PROVINCE_ALIASES[n];
  if (viaAlias && VN_PROVINCE_COORDS[viaAlias]) return VN_PROVINCE_COORDS[viaAlias];

  // 3. Alias substring (địa chỉ có thể kèm thêm chữ, vd "HCM, Việt Nam")
  for (const [alias, canonical] of Object.entries(PROVINCE_ALIASES)) {
    if (n.includes(alias) || alias.includes(n)) {
      if (VN_PROVINCE_COORDS[canonical]) return VN_PROVINCE_COORDS[canonical];
    }
  }

  // 4. So khớp chuẩn hoá với tên tỉnh
  for (const k of KEYS) {
    if (norm(k) === n) return VN_PROVINCE_COORDS[k];
  }

  // 5. Tên tỉnh nằm trong / chứa chuỗi tìm kiếm
  for (const k of KEYS) {
    const nk = norm(k);
    if (n.includes(nk) || nk.includes(n)) return VN_PROVINCE_COORDS[k];
  }

  return null;
}
