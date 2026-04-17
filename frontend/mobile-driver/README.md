# 🚚 Mobile Driver App

Đây là ứng dụng di động dành cho tài xế, thuộc dự án **Hệ thống Quản lý và Truy xuất nguồn gốc nông sản sạch ứng dụng Blockchain**. Khối ứng dụng tài xế giúp đội ngũ vận chuyển theo dõi, quản lý tiến trình giao hàng, và sử dụng mã QR để truy xuất/định danh lô hàng và cập nhật lộ trình giao hàng một cách chính xác theo thời gian thực.

## ✨ Tính năng chính

- **Quản lý danh sách chuyến hàng**: Xem danh sách, chi tiết các trạng thái vận chuyển và lịch sử vận chuyển (Shipment & ActiveShipmentCard).
- **Quét mã QR (QR Scan)**: Quá trình bàn giao, tiếp nhận hàng, hoặc kiểm tra nhanh có thể thao tác thông qua module camera quét mã QR tích hợp.
- **Theo dõi tiến trình theo thời gian thực (Status Timeline)**: Hiển thị dòng thời gian trực quan của hành trình của kiện hàng và cung cấp giao diện cập nhật trạng thái bàn giao.
- **Bảo mật và Xác thực nâng cao**: Tích hợp đăng nhập ứng dụng qua sinh trắc học và mã PIN dự phòng, lưu trữ an toàn JWT Token thông qua Expo Secure Store và Local Authentication.
- **Biểu đồ thống kê (Stat Card)**: Hiện các chỉ số vận chuyển, hoàn thành công việc ở trang chủ (Dashboard).

## 🛠 Công nghệ cốt lõi

- **[React Native] & [Expo]** (SDK 54): Framework linh hoạt giúp tăng tốc phát triển ứng dụng di động chạy đa nền tảng.
- **[Expo Router]**: Hệ thống định tuyến theo cấu trúc file-based mới nhất và mạnh mẽ của Expo.
- **[NativeWind] / Tailwind CSS**: Công cụ thiết kế giao diện (UI CSS framework) mang đến trải nghiệm linh hoạt dựa trên class-utilities.
- **[TanStack React Query] & Axios**: Quản lý state mạnh mẽ ở tầng Network (Data Fetching), hỗ trợ caching, và tối giản hoá tương tác API.
- **[React Native Reanimated]**: Trải nghiệm hoạt ảnh mượt mà tương tác ở mức Native.

## 📦 Các thư viện Native/Expo tích hợp

- `expo-camera`, `expo-image-picker`: Cung cấp tính năng chụp ảnh và xác thực kiện hàng qua QR code.
- `expo-secure-store`: Lưu trữ những thông tin nhạy cảm vào Keychain (trên iOS) hoặc Keystore (trên Android).
- `expo-local-authentication`: Tương tác với TouchID / FaceID để truy cập nhanh ứng dụng.
- `expo-notifications`: Hỗ trợ cập nhật thông báo về trạng thái đơn hàng.

## 📂 Tổ chức thư mục dự án

```text
frontend/mobile-driver/
├── app/                  # Khu vực các màn hình và định tuyến cấu hình (Expo Router/File-based routes)
│   ├── (tabs)/           # Màn hình cho thanh Tab dướng (home, profile, scan, shipments, login)
│   ├── shipments/        # Các màn hình chi tiết quản lý vận chuyển
│   └── _layout.tsx       # Root Layout - Bao quanh toàn bộ các cấu hình navigation
├── components/           # Các reusable components chuyên biệt
│   ├── ui/               # Mảnh ghép nhỏ nhất hỗ trợ Layout (Button, Text, Container...)
│   ├── ActiveShipmentCard.tsx  # Thẻ trạng thái shipment trực tiếp
│   ├── ShipmentCard.tsx        # Thẻ thông tin hàng cơ bản
│   └── StatusTimeline.tsx      # Quản lý hiển thị chuỗi thời gian hiện tại
├── constants/            # Thiết lập biến cục bộ cho project (biến định dạng, mã mãu)
├── hooks/                # Nơi chứa các custom React hooks để xử lí logic hoặc gọi API
├── lib/                  # Utils hoặc helper file, cấu hình networking/API config
├── scripts/              # Các kịch bản mở rộng
├── types/                # Chứa các định nghĩa TypeScript interfaces
├── tailwind.config.js    # Cấu hình cài đặt giao diện của hệ thống design
├── metro.config.js       # Quản lí Bundler - thiết lập custom path resolution nếu cần
└── tsconfig.json         # Thiết lập typescript cho project
```

## 🚀 Hướng dẫn khởi động

### Yêu cầu môi trường
- Node.js (phiên bản ổn định - LTS)
- Trình quản lý package `npm` (hoặc `pnpm` / `yarn`)
- Tải ứng dụng **Expo Go** trên App Store hoặc Google Play cho phần chạy thử thiết bị thực tế, hoặc có sẵn máy ảo Emulator/Simulator.

### Các bước thực hiện

**0. Cài đặt máy android ảo**
- cài đặt "android studio" 
- tạo máy ảo android
- copy đường dẫn máy ảo: tools -> sdk manager -> copy đường dẫn 
- thêm " \emulator " vào cuối đường dẫn
- dán vào setting -> emulator -> Emulator: Emulator Path

**1. Cài đặt các thư viện phụ thuộc (`node_modules`)**

```bash
npm install
```

**2. Bật môi trường giả lập Server (Metro Bundler)**

```bash
npx expo start -c
```
*(Option `-c` để xóa cache trước khi chạy tránh các lỗi khởi tạo tiềm ẩn)*

Sau khi quét hoàn thiện, Terminal sẽ hiển thị một mã QR Code:
- **Thiết bị thật:** Mở ứng dụng điện thoại quét mã QR hoặc đăng nhập tài khoản expo.
- **Android Emulator:** Giữ tab Terminal, nhấn nút `a`.
- **iOS Simulator:** Giữ tab Terminal, nhấn nút `i`. 
- **Phiên bản Web:** Giữ tab Terminal, nhấn nút `w` (Dù ứng dụng tập trung mobile, nhưng tuỳ vào cấu hình react-native-web có thể xem được giao diện hạn chế trên trình duyệt).
