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

**1. Cài Tools & Login**

Cài EAS CLI toàn cục và đăng nhập tài khoản Expo:

# Cài EAS CLI global
npm install -g eas-cli
 
# Đăng nhập tài khoản Expo (tạo tại expo.dev nếu chưa có)
eas login
 
# Kiểm tra đã login chưa
eas whoami

✅  Tạo tài khoản Expo miễn phí tại https://expo.dev — cần thiết để dùng EAS Build.

**2. Cài Packages vào Project**
Vào thư mục project và cài các dependencies cần thiết:
 
npx expo install @react-native-firebase/app
npx expo install @react-native-firebase/messaging
npx expo install expo-dev-client
npx expo install @notifee/react-native

**3. Firebase Console**

1.Vào https://console.firebase.google.com
2.Tạo project mới → bấm icon Android
3.Điền package name: com.bicap.mobiledriver → Register app
4.Download google-services.json → đặt vào root project

Cấu trúc thư mục sau khi đặt file:

mobile-driver/
├── google-services.json       ← đặt ở đây
├── app.json
├── package.json
├── eas.json
└── app/

⚠️  Package name trong app.json PHẢI KHỚP HOÀN TOÀN với package_name trong google-services.json.

**4. Cấu hình app.json**

File app.json hoàn chỉnh cho project mobile-driver:

{
  "expo": {
    "name": "mobile-driver",
    "slug": "mobile-driver",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "mobiledriver",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "googleServicesFile": "./google-services.json",
      "package": "com.bicap.mobiledriver",
      "adaptiveIcon": { ... },
      "edgeToEdgeEnabled": true
    },
    "plugins": [
      "expo-router",
      "@react-native-firebase/app",
      [
        "@react-native-firebase/messaging",
        {
          "ios": {
            "permissions": ["Alert", "Badge", "Sound"]
          }
        }
      ]
    ],
    "extra": {
      "eas": { "projectId": "c01078d3-9cf2-40d0-a291-fe464662e67a" }
    }
  }
}

**5. Cấu hình EAS**

eas build:configure

File eas.json sinh ra sẽ có dạng:

**6. Build APK**

eas build --profile development --platform android

Quá trình build diễn ra trên server EAS:
•Compress & upload project files
•EAS server cài dependencies, prebuild native code
•Ký APK bằng keystore
•Trả về link tải file .apk (mất 5–15 phút)

✅  Có thể theo dõi tiến trình build tại: https://expo.dev/accounts/trughau/projects/mobile-driver

**7. Cài APK lên Máy Thật**

1.Tải file .apk từ link EAS cung cấp
2.Chuyển file vào điện thoại Android (USB hoặc cloud)
3.Mở file .apk → Install → Open

**8. Test Push Notification**

Vào Firebase Console → Engage → Messaging → Send your first message:

Field	Giá trị ví dụ
Title	Đơn hàng mới
Body	Bạn có đơn giao hàng mới từ farm Đà Lạt
Target	App: com.bicap.mobiledriver

✅  Điện thoại cài APK development sẽ nhận được notification ngay lập tức.

npx kill-port 8081
npx expo start --dev-client