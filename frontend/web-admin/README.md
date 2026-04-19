# 🛡️ BICAP Web Admin

> **Bảng điều khiển trung tâm** của hệ thống BICAP (Blockchain-Integrated Clean Agriculture Platform).
> Ứng dụng Next.js 14 App Router, chỉ dành riêng cho người dùng có role **ADMIN**.

---

## 🎯 Tổng quan (Overview)

**BICAP Web Admin** là cổng quản trị hệ thống cấp cao nhất, cung cấp các công cụ để Admin vận hành và giám sát toàn bộ nền tảng. Ứng dụng chạy trên port **`:3000`** và giao tiếp với backend thông qua API Gateway tại **`:8080`**.

### Các chức năng cốt lõi

| Chức năng | Mô tả |
|---|---|
| 📊 **Giám sát hệ thống** | Dashboard thống kê real-time: số nông trại, nhà bán lẻ, đơn hàng, doanh thu theo tháng |
| 👤 **Quản lý tài khoản** | CRUD tài khoản Admin: tạo mới, kích hoạt/vô hiệu hóa |
| 🌾 **Phê duyệt trang trại** | Duyệt/từ chối đăng ký nông trại, xem giấy phép kinh doanh PDF inline |
| 🔗 **Smart Contracts** | Deploy và theo dõi trạng thái 2 hợp đồng thông minh lên mạng VeChainThor |
| 📋 **Xử lý báo cáo** | Tiếp nhận và resolve báo cáo từ mọi Actor (nông dân, nhà bán lẻ, tài xế) |

---

## 🛠 Công nghệ lõi (Tech Stack)

### Framework & Runtime

| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| **Next.js** | `16.2.2` | Framework chính — App Router, Server Components, Middleware |
| **React** | `19.2.4` | UI runtime |
| **TypeScript** | `^5` | Type-safety toàn bộ codebase, strict mode |
| **Tailwind CSS** | `^4` | Utility-first styling |

### Shared Packages (BICAP Monorepo)

| Package | Vai trò trong Web Admin |
|---|---|
| `@bicap/types` | Tất cả TypeScript interfaces và enums (User, Farm, Order, UserRole…) |
| `@bicap/api-client` | `axiosInstance` (tự gắn JWT, tự refresh), `queryClient` config |
| `@bicap/auth` | `AuthProvider`, `useAuth()`, `ProtectedRoute` — quản lý session |
| `@bicap/ui` | `AppShell`, `Sidebar`, `DataTable`, `StatCard`, `StatusBadge`, `ConfirmDialog`, `Toast`… |

### Thư viện đặc thù của Web Admin

| Thư viện | Phiên bản | Vai trò |
|---|---|---|
| **recharts** | `^2.12.7` | Biểu đồ `LineChart` (doanh thu) và `BarChart` (đơn hàng theo tháng) |
| **react-pdf** | `^9.1.0` | Xem giấy phép kinh doanh PDF trực tiếp trong trình duyệt (trang chi tiết farm) |
| **@tanstack/react-query** | `^5.40.0` | Data fetching, caching, invalidation sau mutation |
| **@tanstack/react-table** | `^8.17.0` | Headless data grid cho các bảng dữ liệu phức tạp |

---

## 🔐 Cơ chế bảo mật (Authentication & Authorization)

### Middleware Edge-Runtime (`middleware.ts`)

Lớp bảo vệ đầu tiên của ứng dụng, chạy ở **Edge Runtime** của Next.js — trước khi bất kỳ page hay API route nào được render.

```
Mỗi request đến
    ↓
Có phải route public? (/login, /unauthorized)
    → Có: Cho qua ngay (NextResponse.next())
    ↓
Đọc token từ: cookie "bicap_access_token" | header "Authorization: Bearer ..."
    ↓
Không có token?
    → Redirect → /login
    ↓
Decode JWT payload bằng Buffer.from(base64, "base64")
(Không dùng atob — không tồn tại trong Edge Runtime)
    ↓
Token hết hạn (payload.exp < Date.now() / 1000)?
    → Redirect → /login
    ↓
payload.role !== "ADMIN"?
    → Redirect → /unauthorized
    ↓
Tất cả kiểm tra PASS → NextResponse.next()
```

#### Cấu hình matcher

```typescript
// middleware.ts
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

Middleware **bỏ qua** các đường dẫn: static assets, `_next/image`, `favicon.ico`.

> **⚠️ Lưu ý kỹ thuật:** Token phải được lưu vào **cookie** `bicap_access_token` (bên cạnh `localStorage`) khi đăng nhập để Middleware Edge Runtime có thể đọc được. Xem chi tiết tại trang `/login`.

### Luồng xác thực hoàn chỉnh

```
1. Middleware (Edge):  Kiểm tra token/role theo từng request
2. AuthProvider (Client): Khôi phục session từ localStorage khi app mount
3. useAuth() hook:     Cung cấp { user, role, isAuthenticated } cho mọi component
4. AppShell + Sidebar: Lọc menu hiển thị theo role (chỉ hiện mục ADMIN được phép)
```

---

## 📂 Cấu trúc thư mục & Tính năng (Directory Structure & Features)

### Cây thư mục

```
web-admin/
├── app/
│   ├── layout.tsx                   # Root layout: Inter font, <Providers>
│   ├── page.tsx                     # Root → redirect /dashboard
│   ├── providers.tsx                # QueryClientProvider + AuthProvider
│   ├── globals.css                  # Global Tailwind styles
│   │
│   ├── (admin)/                     # Route group — bọc bởi AdminLayout (AppShell)
│   │   ├── layout.tsx               # NavItems cho Sidebar (5 mục, role ADMIN)
│   │   ├── dashboard/
│   │   │   └── page.tsx             # 📊 Dashboard: StatCards + 2 biểu đồ + pending farms
│   │   ├── accounts/
│   │   │   └── page.tsx             # 👤 Quản lý tài khoản Admin
│   │   ├── farms/
│   │   │   ├── page.tsx             # 🌾 Danh sách farm (3 tab: Chờ/Duyệt/Từ chối)
│   │   │   └── [id]/
│   │   │       └── page.tsx         # 🌾 Chi tiết farm + PDF viewer + Approve/Reject
│   │   ├── contracts/
│   │   │   └── page.tsx             # 🔗 Smart Contracts: status + deploy VeChain
│   │   └── reports/
│   │       └── page.tsx             # 📋 Báo cáo: filter + resolve
│   │
│   └── (auth)/
│       └── login/                   # Trang đăng nhập (public route)
│
├── components/                      # App-specific components
│   ├── accounts/
│   │   └── CreateAdminModal.tsx     # Modal tạo tài khoản Admin mới
│   ├── farms/
│   │   └── RejectModal.tsx          # Modal từ chối farm (có text area lý do)
│   └── reports/
│       └── ResolveModal.tsx         # Modal resolve báo cáo (có admin note)
│
├── lib/
│   └── api.ts                       # Tất cả API functions (gọi qua axiosInstance)
│
├── middleware.ts                     # ⚙️ Auth guard — Edge Runtime
├── next.config.ts                   # transpilePackages, standalone output, images
└── package.json                     # Dependencies
```

### Chi tiết từng Route

#### `/dashboard` — Tổng quan hệ thống

Màn hình chính sau khi đăng nhập (root `/` tự động redirect về `/dashboard`).

- **4 StatCards:** Farms đã duyệt · Nhà bán lẻ · Đơn hàng hôm nay · Doanh thu tháng (VNĐ)
- **LineChart:** Doanh thu 6 tháng (triệu VNĐ) — dùng `recharts`
- **BarChart:** Số đơn hàng theo tháng — dùng `recharts`
- **Widget "Farms chờ duyệt":** Hiển thị tối đa 5 farms PENDING, link sang `/farms`
- **API:** `GET /api/reports/admin/dashboard`

---

#### `/accounts` — Quản lý tài khoản Admin

Quản lý các tài khoản có quyền truy cập Admin Panel.

- **Bảng danh sách** (DataTable): Họ tên · Email · Vai trò (StatusBadge) · Trạng thái · Ngày tạo · Hành động
- **Tạo Admin mới:** Modal `CreateAdminModal` — nhập email, họ tên, mật khẩu
- **Kích hoạt / Vô hiệu hóa:** Xác nhận qua `ConfirmDialog` (variant `danger`/`primary`)
- **API:** `GET/POST /api/auth/admin/users` · `PUT /api/auth/admin/users/:id`

---

#### `/farms` — Phê duyệt trang trại

Hàng đợi phê duyệt đăng ký nông trại của Nông dân.

- **Tab navigation:** Chờ duyệt (PENDING) · Đã duyệt (APPROVED) · Từ chối (REJECTED)
- **Nút Duyệt/Từ chối** chỉ hiển thị ở tab PENDING
- **Modal từ chối** (`RejectModal`): Bắt buộc nhập lý do từ chối
- **Link "Xem →":** Điều hướng đến trang chi tiết `/farms/[id]`
- **API:** `GET /api/farm/admin/farms?status=PENDING|APPROVED|REJECTED` · `PUT .../approve` · `PUT .../reject`

#### `/farms/[id]` — Chi tiết & Phê duyệt nông trại

Trang xem đầy đủ thông tin một nông trại để ra quyết định phê duyệt.

- **Thông tin chi tiết:** Tỉnh/Thành · Địa chỉ · Diện tích · Ngày đăng ký · Trạng thái
- **PDF Viewer inline:** Dùng `react-pdf` để hiển thị giấy phép kinh doanh trực tiếp trên trình duyệt (không cần tải về), gọi `GET /api/farm/admin/farms/:id/license`
- **Phê duyệt / Từ chối** ngay trên trang chi tiết, sau đó auto redirect về `/farms`
- **API:** `GET /api/farm/admin/farms/:id`

---

#### `/contracts` — Quản lý Smart Contracts VeChainThor

Giao diện quản lý vòng đời hợp đồng thông minh trên blockchain.

- **Trạng thái 2 contracts:**
  - `FarmTrace.sol` — Lưu lịch sử vụ mùa bất biến trên blockchain
  - `ProductCertification.sol` — Chứng nhận xuất xưởng sản phẩm
  - Hiển thị: Contract Address · Trạng thái (Deployed/Chưa deploy) · Thời gian deploy lần cuối
- **Nút "🚀 Deploy Contracts":** Trigger backend deploy 2 contracts lên VeChainThor testnet
- **Kết quả deploy:** Hiển thị `txHash` + link trực tiếp đến **VeChain Explorer** (`https://explore.vechain.org/transactions/:txHash`)
- **API:** `GET /api/chain/contracts/status` · `POST /api/chain/contracts/deploy`

---

#### `/reports` — Xử lý báo cáo

Quản lý báo cáo từ tất cả các bên: Nông dân, Nhà bán lẻ, Tài xế.

- **Bộ lọc:** Trạng thái (PENDING/RESOLVED) + Loại báo cáo (COMPLAINT/INCIDENT/FEEDBACK)
- **Bảng danh sách:** Người gửi (role) · Loại · Nội dung (truncate) · Trạng thái (StatusBadge) · Ngày gửi · Hành động
- **Modal Resolve** (`ResolveModal`): Admin nhập ghi chú xử lý (`adminNote`) trước khi đánh dấu RESOLVED
- **API:** `GET /api/reports/admin?type=...&status=...` · `PUT /api/reports/:id/resolve`

---

## 🔗 Tích hợp API (API Integration)

Tất cả request đều đi qua **API Gateway** tại `http://localhost:8080` (cấu hình bởi `NEXT_PUBLIC_API_URL`). Gateway chịu trách nhiệm định tuyến đến đúng microservice.

### Mapping API → Microservice

| API Prefix | Microservice | Port | Chức năng |
|---|---|---|---|
| `/api/auth/...` | **Identity Service** | `:8081` | Xác thực, quản lý tài khoản Admin |
| `/api/farm/...` | **Farm Service** | `:8082` | Quản lý nông trại, phê duyệt, giấy phép |
| `/api/chain/...` | **Blockchain Service** | `:8090` | Deploy smart contracts VeChainThor |
| `/api/reports/...` | **Report Service** | `:8088` | Báo cáo, dashboard stats |

### Danh sách đầy đủ API endpoints (`lib/api.ts`)

```typescript
// ── Identity Service (/api/auth)
GET  /api/auth/admin/users              // Danh sách tài khoản (filter: role, isActive)
POST /api/auth/admin/users              // Tạo tài khoản Admin mới
PUT  /api/auth/admin/users/:id          // Cập nhật role/isActive

// ── Farm Service (/api/farm)
GET  /api/farm/admin/farms              // Danh sách farm (filter: status=PENDING|APPROVED|REJECTED)
GET  /api/farm/admin/farms/:id          // Chi tiết một farm
GET  /api/farm/admin/farms/:id/license  // Tải giấy phép kinh doanh (PDF)
PUT  /api/farm/admin/farms/:id/approve  // Phê duyệt farm
PUT  /api/farm/admin/farms/:id/reject   // Từ chối farm (body: { rejectReason })

// ── Blockchain Service (/api/chain)
GET  /api/chain/contracts/status        // Trạng thái 2 smart contracts
POST /api/chain/contracts/deploy        // Deploy contracts lên VeChainThor testnet

// ── Report Service (/api/reports)
GET  /api/reports/admin/dashboard       // Số liệu dashboard (stats + charts data)
GET  /api/reports/admin                 // Danh sách báo cáo (filter: type, status)
PUT  /api/reports/:id/resolve           // Resolve báo cáo (body: { adminNote })
```

---

## ✅ Tiêu chí hoàn thành (Acceptance Criteria — Task BIC-031)

### Cơ sở hạ tầng & Bảo mật

- [x] Middleware Edge Runtime bảo vệ toàn bộ route, chỉ cho phép role `ADMIN`
- [x] Token hết hạn hoặc không hợp lệ → redirect `/login`
- [x] Role không phải ADMIN → redirect `/unauthorized`
- [x] Root `/` tự động redirect về `/dashboard`
- [x] `AuthProvider` + `QueryClientProvider` được cài đặt ở root layout

### Dashboard

- [x] Hiển thị đủ 4 StatCards với dữ liệu real-time từ API
- [x] `LineChart` doanh thu 6 tháng render đúng với `recharts`
- [x] `BarChart` đơn hàng theo tháng render đúng với `recharts`
- [x] Widget farms chờ duyệt hiển thị tối đa 5 bản ghi, có link "Xem tất cả"

### Quản lý tài khoản

- [x] Danh sách tài khoản Admin hiển thị đúng với `DataTable`
- [x] Tạo tài khoản Admin mới qua `CreateAdminModal`
- [x] Kích hoạt / vô hiệu hóa tài khoản với `ConfirmDialog` xác nhận
- [x] Cache tự động invalidate sau mỗi mutation

### Phê duyệt trang trại

- [x] Tab navigation 3 trạng thái (PENDING / APPROVED / REJECTED)
- [x] Nút Duyệt/Từ chối chỉ xuất hiện ở tab PENDING
- [x] `RejectModal` bắt buộc nhập lý do trước khi từ chối
- [x] Trang chi tiết `/farms/[id]` hiển thị đầy đủ thông tin farm
- [x] PDF giấy phép kinh doanh render inline bằng `react-pdf`
- [x] Sau phê duyệt/từ chối → tự redirect về `/farms` sau 1.5 giây

### Smart Contracts

- [x] Hiển thị đúng địa chỉ 2 contracts (`FarmTrace.sol`, `ProductCertification.sol`)
- [x] Badge trạng thái "Deployed" / "Chưa deploy" hiển thị chính xác
- [x] Nút Deploy disabled khi đang xử lý (`isPending`)
- [x] Sau deploy thành công: hiển thị `txHash` + link VeChain Explorer
- [x] Tự động refetch contract status sau deploy

### Xử lý báo cáo

- [x] Filter theo trạng thái (PENDING/RESOLVED) và loại (COMPLAINT/INCIDENT/FEEDBACK)
- [x] Query key bao gồm filter params — tự refetch khi filter thay đổi
- [x] `ResolveModal` yêu cầu nhập `adminNote` trước khi resolve
- [x] `StatusBadge` hiển thị đúng màu theo trạng thái

---

## 🚀 Hướng dẫn chạy Local

### Yêu cầu hệ thống

- **Node.js** >= 18.x
- **pnpm** >= 9.x
- **API Gateway** đang chạy tại `http://localhost:8080`

### 1. Cài đặt dependencies

```bash
# Từ ROOT của monorepo (chứa pnpm-workspace.yaml)
# pnpm tự động install cả web-admin và các shared packages
pnpm install
```

> **Lưu ý:** Không chạy `pnpm install` riêng trong thư mục `web-admin/`. Workspace root quản lý tất cả.

### 2. Cấu hình biến môi trường

Tạo file `.env.local` trong thư mục `web-admin/`:

```bash
# web-admin/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Khởi chạy môi trường Development

```bash
# Từ thư mục web-admin/
pnpm dev

# Hoặc từ root monorepo, chạy riêng app này
pnpm --filter web-admin dev
```

Ứng dụng chạy tại: **http://localhost:3000**

### 4. Kiểm tra TypeScript

```bash
# Từ thư mục web-admin/
pnpm typecheck

# Tương đương với:
tsc --noEmit
```

### 5. Build Production

```bash
pnpm build      # Build standalone output
pnpm start      # Chạy production server tại :3000
```

---

## 📁 Cấu trúc file quan trọng

| File | Mô tả |
|---|---|
| [`middleware.ts`](./middleware.ts) | ⚙️ Auth guard Edge Runtime — điểm bảo mật quan trọng nhất |
| [`lib/api.ts`](./lib/api.ts) | 🔌 Toàn bộ API call functions của Web Admin |
| [`app/providers.tsx`](./app/providers.tsx) | 🔧 Khởi tạo `QueryClient` + `AuthProvider` |
| [`app/(admin)/layout.tsx`](./app/%28admin%29/layout.tsx) | 🧭 `AppShell` với NavItems cho Admin |
| [`next.config.ts`](./next.config.ts) | ⚙️ `transpilePackages`, standalone output, image domains |

---

## 🔧 Môi trường & Biến cấu hình

| Biến | Mô tả | Giá trị mặc định |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Địa chỉ API Gateway (prefix mọi API call) | `http://localhost:8080` |

---

<div align="center">
  <sub>BICAP Web Admin — Task <strong>BIC-031</strong> · Maintained by <strong>@bicap/frontend-core</strong></sub>
</div>
