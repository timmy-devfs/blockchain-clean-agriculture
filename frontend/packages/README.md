# 📦 BICAP — Shared Packages

> **Monorepo Shared Packages** cho hệ thống **BICAP** (Blockchain-Integrated Clean Agriculture Platform).
> Được sử dụng chung bởi **web-app** (Next.js 14, role-based routes) và **2 mobile apps** (React Native) trong kiến trúc pnpm workspace.

---

## 🎯 Mục đích (Overview)

Trong một hệ thống phân tán bao gồm nhiều ứng dụng (web admin, cổng nông dân, cổng nhà bán lẻ, cổng tài xế, v.v.), việc duy trì **type definitions**, **logic xác thực** và **UI components** riêng lẻ ở từng app sẽ dẫn đến:

| Vấn đề | Tác động |
|---|---|
| Trùng lặp code | Khó bảo trì, sửa 1 chỗ phải sửa nhiều nơi |
| Định nghĩa type không đồng nhất | Runtime bugs khó truy vết |
| UX không nhất quán | Trải nghiệm người dùng kém chuyên nghiệp |
| Logic auth sai lệch giữa apps | Lỗ hổng bảo mật tiềm ẩn |

**Giải pháp:** Tách biệt thành **4 shared packages** độc lập, có phiên bản, được quản lý qua **pnpm workspace protocol** (`workspace:*`). Mỗi app chỉ cần import từ package name — không copy-paste code.

```
@bicap/types     ←  Nguồn của sự thật (single source of truth) cho mọi type/enum
@bicap/api-client ← Toàn bộ HTTP logic: JWT header, token refresh, React Query config
@bicap/auth      ←  Context, hook, guard bảo vệ route theo role
@bicap/ui        ←  Thư viện component dùng chung, Tailwind CSS
```

### Dependency Graph

```
@bicap/types
    ↑
@bicap/api-client
    ↑
@bicap/auth
    ↑
@bicap/ui  ──── depends on ──→  @bicap/types
                                @bicap/auth (qua AppShell, Sidebar)
```

---

## 📦 Danh sách Packages

### `@bicap/types` — Định nghĩa kiểu dữ liệu

> **Không có runtime dependencies.** Chỉ chứa TypeScript interface và enum thuần.

**Mục đích:** Là nguồn sự thật duy nhất cho toàn bộ kiểu dữ liệu, đồng bộ chặt chẽ với các entity và DTO của backend Java/Spring Boot.

| Export | Loại | Mô tả |
|---|---|---|
| `ApiResponse<T>` | Interface | Wrapper chuẩn cho mọi HTTP response: `{ code, message, data }` |
| `PageResponse<T>` | Interface | Danh sách có phân trang: `{ data[], total, page, size, totalPages }` |
| `User` | Interface | Thông tin người dùng: id, email, fullName, phone, role, isActive |
| `AuthTokens` | Interface | Cặp token xác thực: accessToken, refreshToken, expiresIn |
| `Farm` | Interface | Thông tin nông trại: id, ownerId, farmName, province, totalArea, isApproved |
| `Season` | Interface | Vụ mùa: cropType, quantity, status, blockchainTxHash, qrCodeUrl |
| `Order` | Interface | Đơn hàng với lịch sử trạng thái |
| `Shipment` | Interface | Lô hàng vận chuyển với driver, vehicle, lịch sử |
| `IoTReading` | Interface | Dữ liệu cảm biến IoT: TEMPERATURE, HUMIDITY, PH |
| `Payment` | Interface | Thanh toán qua VNPAY / MOMO |
| `UserRole` | Enum | `ADMIN`, `FARM_MANAGER`, `RETAILER`, `SHIP_DRIVER`, `SHIPPING_MANAGER`, `GUEST` |
| `SeasonStatus` | Enum | `PREPARING`, `ACTIVE`, `HARVESTED`, `EXPORTED` |
| `OrderStatus` | Enum | `PENDING_PAYMENT`, `PLACED`, `CONFIRMED`, `SHIPPING`, `DELIVERED`, `CANCELLED` |
| `ShipmentStatus` | Enum | `ASSIGNED`, `PICKED_UP`, `IN_TRANSIT`, `DELAYED`, `DELIVERED`, `CANCELLED`, `RETURNED` |
| `VehicleType` | Enum | `MOTORBIKE`, `VAN`, `TRUCK`, `REFRIGERATED` |

---

### `@bicap/api-client` — HTTP Client & Query Configuration

> **Dependencies:** `axios ^1.7`, `@tanstack/react-query ^5.40`, `@bicap/types`

**Mục đích:** Cung cấp một `axiosInstance` duy nhất đã được cấu hình đầy đủ. Mọi API call trong toàn bộ hệ thống **bắt buộc** phải đi qua instance này.

#### Cấu hình `axiosInstance`

| Thuộc tính | Giá trị |
|---|---|
| `baseURL` | `NEXT_PUBLIC_API_URL` hoặc `http://localhost:8080` |
| `timeout` | 10.000ms (10 giây) |
| `Content-Type` | `application/json` |

#### Cơ chế Request Interceptor (Tự động gắn JWT)

Mỗi outgoing request được tự động kiểm tra `localStorage` để đính kèm header xác thực:

```
Mỗi request
  → tokenStorage.getAccessToken()
  → Nếu có token → headers.Authorization = `Bearer ${token}`
  → Gửi request đến API Gateway :8080
```

#### Cơ chế Response Interceptor (Tự động Refresh Token)

Xử lý lỗi `401 Unauthorized` theo pattern **queue-based** để tránh gọi refresh loop:

```
Nhận 401
  → Chưa đang refresh?
      → Đặt isRefreshing = true
      → Gọi POST /api/auth/refresh-token (dùng axios thuần, KHÔNG dùng axiosInstance)
      → Lưu token mới → processQueue() → Retry original request
  → Đang refresh?
      → Đưa request vào failedQueue, chờ token mới
  → Refresh thất bại?
      → clearTokens() → redirect /login
```

#### Cấu hình `queryClient` (React Query)

| Option | Giá trị | Lý do |
|---|---|---|
| `staleTime` | 30.000ms | Tránh refetch liên tục trong 30 giây |
| `retry` (queries) | 1 | Retry 1 lần khi network lỗi thoáng qua |
| `retry` (mutations) | 0 | Không retry mutation để tránh side-effect kép |
| `refetchOnWindowFocus` | `false` | Tránh refetch không mong muốn khi người dùng switch tab |

#### Exports từ `@bicap/api-client`

```typescript
export { axiosInstance }   // Axios instance đã cấu hình
export { queryClient }     // React Query client config
export { tokenStorage }    // Tiện ích đọc/ghi/xóa JWT trong localStorage
```

---

### `@bicap/auth` — Authentication & Authorization

> **Dependencies:** `@bicap/api-client`, `@bicap/types`, `next ^14`

**Mục đích:** Cung cấp toàn bộ logic xác thực và phân quyền theo role cho các Next.js app. Mỗi app chỉ cần bọc `<AuthProvider>` ở root layout.

#### Các module chính

| Export | Loại | Mô tả |
|---|---|---|
| `AuthProvider` | Component | Context Provider, bọc ở root `layout.tsx`. Tự khôi phục session từ localStorage khi reload. |
| `useAuth()` | Hook | Trả về `{ user, role, isLoading, isAuthenticated, login, logout }` |
| `ProtectedRoute` | Component | Guard bảo vệ page: redirect `/login` nếu chưa xác thực, redirect `/unauthorized` nếu sai role |
| `decodeJWT(token)` | Utility | Giải mã JWT payload (không verify signature — Gateway đã verify) |
| `isTokenExpired(token)` | Utility | Kiểm tra token hết hạn, có buffer 30 giây tránh edge case |
| `getPayload(token)` | Utility | Alias của `decodeJWT` |
| `tokenStorage` | Object | Quản lý `localStorage` với keys `bicap_access_token` / `bicap_refresh_token` |

#### Luồng hoạt động của `AuthProvider`

```
App khởi động
  → Đọc accessToken từ localStorage
  → Nếu token hợp lệ (chưa hết hạn):
      → GET /api/auth/me → setUser()
  → isLoading = false → Render app

login(email, password)
  → POST /api/auth/login
  → Lưu accessToken + refreshToken vào localStorage
  → Decode JWT → setRole()
  → GET /api/auth/me → setUser()

logout()
  → POST /api/auth/logout (best-effort)
  → clearTokens() → setUser(null) → setRole(null)
```

---

### `@bicap/ui` — Shared Component Library

> **Dependencies:** `@bicap/types`, `@bicap/auth` (peer). **Styling:** Tailwind CSS (cấu hình trong từng app).

**Mục đích:** Thư viện component dùng chung đảm bảo trải nghiệm người dùng nhất quán trên toàn hệ thống. Tất cả component đều hỗ trợ `"use client"` directive của Next.js App Router.

#### Danh sách Components

| Component | Props chính | Mô tả |
|---|---|---|
| `AppShell` | `navItems`, `logo` | Layout wrapper cho toàn bộ app: tích hợp `Sidebar` + `Header` + nút Đăng xuất |
| `Sidebar` | `navItems`, `logo` | Thanh điều hướng bên trái, tự động lọc menu theo `role` của người dùng |
| `DataTable<T>` | `columns`, `data`, `isLoading`, `keyField` | Bảng dữ liệu generic với skeleton loading (5 hàng), empty state, hỗ trợ custom cell renderer |
| `StatusBadge` | `status` | Badge màu sắc tự động cho `SeasonStatus`, `OrderStatus`, `ShipmentStatus` |
| `StatCard` | `title`, `value`, `icon`, `trend` | Card thống kê với chỉ số trend (▲/▼ % so với tháng trước) |
| `Toast` | `message`, `type`, `duration`, `onClose` | Thông báo pop-up: `success`, `error`, `warning`, `info`. Tự đóng sau `duration` ms |
| `ConfirmDialog` | `isOpen`, `title`, `message`, `onConfirm`, `onCancel`, `variant` | Modal xác nhận với 2 variant: `primary` (xanh) và `danger` (đỏ) |
| `FormInput` | `label`, `error`, `required`, `...InputHTMLAttributes` | Input field có label, validation error, tương thích `react-hook-form` |
| `FileUpload` | `accept`, `maxSizeMB`, `onFileSelect`, `label` | Upload file với drag-and-drop, kiểm tra kích thước, preview ảnh |
| `QRDisplay` | `qrUrl`, `seasonId`, `size` | Hiển thị QR code của vụ mùa từ blockchain-service, có nút tải xuống PNG |

---

## 🚀 Hướng dẫn Khởi tạo (Getting Started)

### Yêu cầu hệ thống

- **Node.js** >= 18.x
- **pnpm** >= 9.x (`npm install -g pnpm`)

### Cài đặt dependencies

Chạy lệnh sau tại **thư mục gốc của monorepo** (không phải trong thư mục `packages/`). pnpm workspace sẽ tự động resolve và link tất cả internal packages.

```bash
# Tại root của monorepo (ngang hàng với pnpm-workspace.yaml)
pnpm install
```

> **Lưu ý:** Không chạy `pnpm install` trong từng package con. pnpm workspace quản lý tất cả từ root.

### Kiểm tra lỗi TypeScript

Kiểm tra type errors cho toàn bộ packages cùng một lúc:

```bash
# Kiểm tra từng package riêng lẻ
pnpm --filter @bicap/types typecheck
pnpm --filter @bicap/api-client typecheck
pnpm --filter @bicap/auth typecheck
pnpm --filter @bicap/ui typecheck

# Kiểm tra toàn bộ packages cùng lúc (từ root)
pnpm -r typecheck
```

Hoặc kiểm tra trực tiếp trong từng thư mục package:

```bash
cd packages/types && tsc --noEmit
cd packages/api-client && tsc --noEmit
cd packages/auth && tsc --noEmit
cd packages/ui && tsc --noEmit
```

---

## 💻 Cách sử dụng (Usage Examples)

### 1. Setup trong Next.js App — Root Layout

Mỗi Next.js app cần bọc `AuthProvider` và `QueryClientProvider` ở root layout:

```tsx
// frontend/web-app/app/layout.tsx
import { AuthProvider } from '@bicap/auth';
import { queryClient } from '@bicap/api-client';
import { QueryClientProvider } from '@tanstack/react-query';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

---

### 2. Sử dụng `@bicap/types` — Import Types & Enums

```typescript
// Import interface
import type { User, Farm, Season, Order, Shipment } from '@bicap/types';
import type { ApiResponse, PageResponse } from '@bicap/types';

// Import enum
import { UserRole, SeasonStatus, OrderStatus, ShipmentStatus } from '@bicap/types';

// Ví dụ sử dụng trong component
const handleStatus = (status: SeasonStatus) => {
  if (status === SeasonStatus.ACTIVE) {
    console.log('Vụ mùa đang hoạt động');
  }
};

// Ví dụ với generic wrapper
const response: ApiResponse<User> = await axiosInstance.get('/api/auth/me');
const pagedFarms: PageResponse<Farm> = await axiosInstance.get('/api/farms').then(r => r.data);
```

---

### 3. Sử dụng `@bicap/api-client` — Gọi API

```typescript
// ✅ ĐÚNG: Luôn dùng axiosInstance — token sẽ được tự động đính kèm
import { axiosInstance } from '@bicap/api-client';
import type { ApiResponse, Farm, PageResponse } from '@bicap/types';

// GET: Lấy danh sách nông trại
const getFarms = async (): Promise<PageResponse<Farm>> => {
  const { data } = await axiosInstance.get<ApiResponse<PageResponse<Farm>>>('/api/farms');
  return data.data;
};

// POST: Tạo vụ mùa mới
const createSeason = async (payload: Partial<Season>) => {
  const { data } = await axiosInstance.post<ApiResponse<Season>>('/api/seasons', payload);
  return data.data;
};

// PUT: Cập nhật trạng thái đơn hàng
const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  const { data } = await axiosInstance.put<ApiResponse<Order>>(
    `/api/orders/${orderId}/status`,
    { status }
  );
  return data.data;
};

// ❌ SAI: Không dùng axios.create() hay fetch() riêng — sẽ mất JWT header
// const res = await fetch('http://localhost:8080/api/farms'); // ← CẤM
```

---

### 4. Sử dụng `@bicap/api-client` — React Query Integration

```typescript
import { axiosInstance, queryClient } from '@bicap/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, Farm } from '@bicap/types';

// Định nghĩa query keys theo chuẩn
const QUERY_KEYS = {
  farms: ['farms'] as const,
  farm: (id: string) => ['farms', id] as const,
};

// Hook lấy danh sách nông trại
export function useFarms() {
  return useQuery({
    queryKey: QUERY_KEYS.farms,
    queryFn: async () => {
      const { data } = await axiosInstance.get<ApiResponse<Farm[]>>('/api/farms');
      return data.data;
    },
  });
}

// Hook tạo nông trại mới
export function useCreateFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Farm>) =>
      axiosInstance.post<ApiResponse<Farm>>('/api/farms', payload),
    onSuccess: () => {
      // Invalidate cache để refetch danh sách
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farms });
    },
  });
}
```

---

### 5. Sử dụng `@bicap/auth` — Hook `useAuth`

```tsx
'use client';

import { useAuth } from '@bicap/auth';
import { UserRole } from '@bicap/types';

export function ProfileHeader() {
  const { user, role, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) return <div>Đang tải...</div>;
  if (!isAuthenticated) return null;

  return (
    <div>
      <p>Xin chào, {user?.fullName}</p>
      <p>Role: {role}</p>

      {/* Hiển thị UI theo role */}
      {role === UserRole.ADMIN && (
        <button>Quản trị hệ thống</button>
      )}

      <button onClick={logout}>Đăng xuất</button>
    </div>
  );
}
```

---

### 6. Sử dụng `@bicap/auth` — `ProtectedRoute`

```tsx
// Bảo vệ toàn bộ page, chỉ cho phép ADMIN và FARM_MANAGER
import { ProtectedRoute } from '@bicap/auth';
import { UserRole } from '@bicap/types';

export default function FarmsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FARM_MANAGER]}>
      <FarmsPageContent />
    </ProtectedRoute>
  );
}

// Bảo vệ không giới hạn role (chỉ cần đăng nhập)
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

---

### 7. Sử dụng `@bicap/ui` — Component Library

#### `AppShell` — Layout wrapper

```tsx
import { AppShell } from '@bicap/ui';
import type { NavItem } from '@bicap/ui';
import { UserRole } from '@bicap/types';

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Tổng quan', icon: <HomeIcon /> },
  { href: '/farms', label: 'Nông trại', icon: <FarmIcon />, allowedRoles: [UserRole.ADMIN] },
  { href: '/orders', label: 'Đơn hàng', icon: <OrderIcon /> },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell navItems={navItems}>{children}</AppShell>;
}
```

#### `DataTable` — Bảng dữ liệu generic

```tsx
import { DataTable } from '@bicap/ui';
import type { Column } from '@bicap/ui';
import { StatusBadge } from '@bicap/ui';
import type { Farm } from '@bicap/types';

// Lưu ý: T phải extends Record<string, unknown>
type FarmRow = Farm & Record<string, unknown>;

const columns: Column<FarmRow>[] = [
  { key: 'farmName', header: 'Tên nông trại' },
  { key: 'province', header: 'Tỉnh/Thành' },
  {
    key: 'isApproved',
    header: 'Trạng thái',
    render: (value) => (
      <StatusBadge status={value ? 'ACTIVE' : 'PREPARING'} />
    ),
  },
];

export function FarmsTable({ farms, isLoading }: { farms: FarmRow[]; isLoading: boolean }) {
  return (
    <DataTable
      columns={columns}
      data={farms}
      isLoading={isLoading}
      keyField="id"
      emptyMessage="Chưa có nông trại nào"
    />
  );
}
```

#### `StatusBadge` — Badge trạng thái

```tsx
import { StatusBadge } from '@bicap/ui';
import { SeasonStatus, OrderStatus } from '@bicap/types';

// Tự động ánh xạ màu theo enum value
<StatusBadge status={SeasonStatus.ACTIVE} />        // → Badge xanh lá
<StatusBadge status={OrderStatus.CANCELLED} />      // → Badge đỏ
<StatusBadge status={ShipmentStatus.IN_TRANSIT} />  // → Badge xanh dương
```

#### `StatCard` — Card thống kê

```tsx
import { StatCard } from '@bicap/ui';

<StatCard
  title="Tổng đơn hàng"
  value={1_284}
  icon={<ShoppingCartIcon />}
  trend={+12.5}   // ▲ 12.5% so với tháng trước
/>

<StatCard
  title="Nông trại chờ duyệt"
  value={7}
  icon={<FarmIcon />}
  trend={-3.2}    // ▼ 3.2% so với tháng trước
/>
```

#### `ConfirmDialog` — Hộp thoại xác nhận

```tsx
import { ConfirmDialog } from '@bicap/ui';

<ConfirmDialog
  isOpen={isDeleteOpen}
  title="Xác nhận xóa nông trại"
  message="Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?"
  confirmLabel="Xóa"
  variant="danger"
  onConfirm={handleDelete}
  onCancel={() => setIsDeleteOpen(false)}
/>
```

#### `Toast` — Thông báo

```tsx
import { Toast } from '@bicap/ui';

{toastVisible && (
  <Toast
    message="Tạo vụ mùa thành công!"
    type="success"
    duration={3000}
    onClose={() => setToastVisible(false)}
  />
)}
```

#### `FileUpload` — Upload file

```tsx
import { FileUpload } from '@bicap/ui';

<FileUpload
  accept="image/*,.pdf"
  maxSizeMB={10}
  label="Kéo thả hoặc click để tải lên Giấy phép kinh doanh"
  onFileSelect={(file) => uploadLicense(file)}
/>
```

#### `QRDisplay` — Hiển thị QR Code vụ mùa

```tsx
import { QRDisplay } from '@bicap/ui';

// qrUrl là URL hoặc base64 PNG từ blockchain-service
<QRDisplay
  qrUrl={season.qrCodeUrl}
  seasonId={season.id}
  size={256}
/>
```

---

## ⚠️ Lưu ý Quan trọng

### 🔒 Cấm sửa đổi Axios Interceptor

> **TUYỆT ĐỐI KHÔNG** thay đổi logic bên trong `axiosInstance.interceptors` tại `packages/api-client/src/axiosInstance.ts` mà không có sự đồng ý của **Tech Lead**.

**Lý do:** Interceptor xử lý cơ chế refresh token theo pattern queue-based. Bất kỳ thay đổi sai lầm nào đều có thể gây ra:
- **Infinite loop:** Refresh token gọi chính `axiosInstance`, dẫn đến đệ quy vô hạn.
- **Race condition:** Nhiều request 401 đến cùng lúc gây gọi refresh nhiều lần.
- **Session leak:** Token không được xóa đúng cách khi refresh thất bại.

Nếu cần thay đổi, hãy tạo Pull Request và tag reviewer là `@bicap/frontend-core`.

---

### 📐 Tuân thủ TypeScript Strict Mode

Tất cả packages đều bật **TypeScript strict mode**. Các quy tắc bắt buộc:

```jsonc
// tsconfig.json (packages)
{
  "compilerOptions": {
    "strict": true,           // Bắt buộc
    "noImplicitAny": true,    // Cấm implicit any
    "strictNullChecks": true  // Phải xử lý null/undefined
  }
}
```

❌ **Cấm dùng:**
```typescript
// KHÔNG dùng any
const data: any = response.data;

// KHÔNG bỏ qua null check
user.fullName.toUpperCase(); // user có thể null!

// KHÔNG cast tùy tiện
const user = response as User;
```

✅ **Phải dùng:**
```typescript
// Dùng generic type đúng cách
const { data } = await axiosInstance.get<ApiResponse<User>>('/api/auth/me');

// Xử lý null an toàn
user?.fullName?.toUpperCase();

// Kiểm tra type trước khi cast
if (response && 'data' in response) { ... }
```

---

### 🌐 Quy tắc API Gateway

- Mọi API call **phải** trỏ về API Gateway tại port **`:8080`**.
- Biến môi trường: `NEXT_PUBLIC_API_URL=http://localhost:8080` (development).
- **Không được** gọi thẳng vào microservice port nào khác từ Frontend.
- File `.env.local` phải có `NEXT_PUBLIC_API_URL` — không hardcode URL trong component.

```bash
# .env.local (mỗi app)
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

### 📋 Quy tắc thêm Component/Type mới

Khi cần thêm type hoặc component mới vào shared packages:

1. **`@bicap/types`:** Đồng bộ với backend DTO/Entity trước khi thêm. Tag `@bicap/backend` để confirm contract.
2. **`@bicap/ui`:** Component mới phải có `"use client"` nếu dùng hooks/events. Phải hỗ trợ `className` prop để có thể override style.
3. **`@bicap/auth`:** Không thêm logic nghiệp vụ vào auth package — chỉ xác thực và phân quyền.
4. Sau khi thêm export mới, cập nhật `src/index.ts` của package tương ứng.
5. Chạy `pnpm -r typecheck` để đảm bảo không breaking change.

---

## 🗂️ Cấu trúc thư mục

```
packages/
├── types/                    # @bicap/types
│   ├── src/
│   │   └── index.ts          # Tất cả interfaces, enums
│   ├── package.json
│   └── tsconfig.json
│
├── api-client/               # @bicap/api-client
│   ├── src/
│   │   ├── axiosInstance.ts  # Cấm sửa interceptor không có approval
│   │   ├── queryClient.ts    # React Query config
│   │   ├── tokenStorage.ts   # localStorage utility
│   │   └── index.ts          # Public exports
│   ├── package.json
│   └── tsconfig.json
│
├── auth/                     # @bicap/auth
│   ├── src/
│   │   ├── AuthContext.tsx   # Provider + useAuth hook
│   │   ├── ProtectedRoute.tsx # Route guard theo role
│   │   ├── jwtUtils.ts       # decode, isExpired, getPayload
│   │   ├── tokenStorage.ts   # Re-export từ api-client
│   │   └── index.ts          # Public exports
│   ├── package.json
│   └── tsconfig.json
│
└── ui/                       # @bicap/ui
    ├── src/
    │   ├── components/
    │   │   ├── AppShell.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── DataTable.tsx
    │   │   ├── StatusBadge.tsx
    │   │   ├── StatCard.tsx
    │   │   ├── Toast.tsx
    │   │   ├── ConfirmDialog.tsx
    │   │   ├── FormInput.tsx
    │   │   ├── FileUpload.tsx
    │   │   └── QRDisplay.tsx
    │   └── index.ts          # Public exports
    ├── package.json
    └── tsconfig.json
```

---

## 📌 Tham chiếu

| Tài liệu | Mô tả |
|---|---|
| [Task BIC-030](https://bicap.atlassian.net) | Specification gốc của shared packages |
| [pnpm Workspace Docs](https://pnpm.io/workspaces) | Hướng dẫn cấu hình pnpm workspace |
| [Axios Interceptors](https://axios-http.com/docs/interceptors) | Tài liệu chính thức về interceptor |
| [TanStack Query v5](https://tanstack.com/query/v5) | Tài liệu React Query |
| [Next.js App Router](https://nextjs.org/docs/app) | Hướng dẫn Next.js 14 App Router |

---

<div align="center">
  <sub>BICAP Frontend Monorepo — Maintained by <strong>@bicap/frontend-core</strong></sub>
</div>
