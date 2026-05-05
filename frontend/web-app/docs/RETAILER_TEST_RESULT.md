# Retailer flow — kết quả kiểm tra (BICAP)

**Ngày:** 2026-05-02  
**Môi trường mục tiêu:** `NEXT_PUBLIC_API_URL=http://localhost/api` (Nginx → Gateway :8080)

## BƯỚC 1 — Audit `legacy/retailer/services/api.ts`

`axios.create({ baseURL })` với `baseURL = (NEXT_PUBLIC_API_URL hoặc `http://localhost/api`) + `/retail` → **không** thêm segment `/api/` vào từng path (đã đúng).

| Call | METHOD + path trên axios (relative tới base `/api/retail`) | So khớp gateway |
|------|------------------------------------------------------------|-----------------|
| `loginRetailer` | **POST** `/api/auth/login` — URL đầy đủ: `${gatewayOrigin()}/api/auth/login` (không qua `retailApi`) | **ĐÚNG** (`http://localhost/api/auth/login`) |
| `searchProducts` | **GET** `/marketplace/products` | **ĐÚNG** → `GET http://localhost/api/retail/marketplace/products` |
| `getProductDetail` | **GET** `/marketplace/products/:id` | **ĐÚNG** |
| `createOrder` | **POST** `/orders` | **ĐÚNG** → `POST http://localhost/api/retail/orders` |
| `callbackPaymentSuccess` | **POST** `/orders/payment-callback` | **ĐÚNG** |
| `getOrdersByStatus` | **GET** `/orders` | **ĐÚNG** |
| `getShippingTimeline` | **GET** `/orders/:orderId/shipping` | **ĐÚNG** |
| `qrScanTrace` | **POST** `/qr/scan` | **ĐÚNG** |
| `confirmDelivery` | **POST** `/orders/:orderId/confirm-delivery` | **ĐÚNG** |
| `getKeywordSuggestions` | **GET** `/marketplace/products` (params) | **ĐÚNG** |
| `getNotifications` | Không gọi HTTP — backend chưa có route | **N/A** (throw + `console.warn`) |

**Không có** pattern sai kiểu `GET /api/retail/...` trong path (double `/api`). Không đổi path marketplace/orders so với audit — chỉ chỉnh hành vi lỗi/mocking.

## BƯỚC 2–3 — Thay đổi mã nguồn đã áp dụng

| Hạng mục | Nội dung |
|----------|----------|
| `api.ts` | Bỏ auto-login ẩn (`ensureRetailToken`) và header demo JWT; request chỉ gắn `Authorization` khi có `bicap_access_token` trong `localStorage` (đồng bộ với `@bicap/api-client` / login Next). |
| `api.ts` | `getNotifications`: `console.warn('[RETAILER] Endpoint chưa có: GET /notifications …')` + `throw new Error('Endpoint chưa sẵn sàng: /retail/notifications')`. |
| `api.ts` | `getKeywordSuggestions`: `catch` rethrow (không nuốt lỗi trả `[]`). UI autocomplete bắt lỗi + `message.warning`. |
| `App.tsx` | Route MemoryRouter chuẩn hoá: `/dashboard`, `/marketplace`, `/products/:id`, `/orders`, … — khớp `initialPath` từ các page Next. |
| `App.tsx` | Marketplace / Orders / Product detail / QR / Confirm delivery: UI khi lỗi query/API — không blank; thông báo rõ hoặc “Tính năng đang được phát triển”. |
| `NotificationBell` | Khi query notifications lỗi: icon mờ + tooltip (không crash). |
| `RetailerLegacyConsole.tsx` | `dynamic(..., { ssr: false })`; `MemoryRouter initialEntries` từ prop `initialPath` (chuẩn hoá bỏ prefix `/retailer` nếu có). |
| `app/(retailer)/layout.tsx` | Đã có `ProtectedRoute` + `AppShell` `hideSidebar` — không đổi. |
| Retailer pages | `ErrorBoundary` + `Suspense` bọc `RetailerLegacyConsole`; `dashboard` → `/dashboard`, `marketplace` → `/marketplace`, … |
| `components/ErrorBoundary.tsx` | Fallback: “Lỗi tải module. Thử lại.” + nút Thử lại. |

## `pnpm exec tsc --noEmit` (web-app)

**PASS** — không lỗi TypeScript sau các chỉnh sửa.

---

## BƯỚC 7 — Kiểm tra thủ công trình duyệt

Cần stack backend (Gateway + identity + retailer-service) và `pnpm dev` trên web-app.

| Bước | Tiêu chí | Kết quả |
|------|----------|---------|
| 1 | `http://localhost:3000/login` → `retail1@bicap.io` / `123456` | **Cần người thực hiện** khi API chạy |
| 2 | Redirect → `/retailer/dashboard`, không blank | **Cần người thực hiện** |
| 3 | `/retailer/marketplace` — Network: chỉ `http://localhost/api/retail/...` (không `:3001`) | **Cần người thực hiện** |
| 4 | Marketplace: có sản phẩm hoặc thông báo rõ / “Tính năng đang được phát triển” khi lỗi | **Cần người thực hiện** |
| 5 | Đặt hàng + `/retailer/orders` | **Cần người thực hiện** |

### Tiêu chí chấp nhận (checklist — đánh dấu sau khi test)

- [ ] Login retailer → `/retailer/dashboard` hiển thị, không blank
- [ ] Network: không request tới `localhost:3001` hay port lạ
- [ ] API retailer → `http://localhost/api/retail/*` (orders retail nằm dưới `/api/retail/orders`, không mock silent `[]` khi endpoint lỗi)
- [ ] Marketplace: dữ liệu hoặc thông báo phát triển — không crash trắng
- [ ] 404/500: UI không crash toàn trang (legacy hiển thị Alert/message/error boundary)
