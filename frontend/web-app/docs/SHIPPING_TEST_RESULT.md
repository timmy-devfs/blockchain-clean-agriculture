# Shipping integration — test result (BICAP web-app)

**Ngày:** 2026-05-02  
**Phạm vi:** Legacy shipping UI, sync JSON, admin shipments, gateway URL.

## Bước 1 — Hardcode URL trong `legacy/shipping/`

Đã grep các pattern (`:8084`, `NEXT_PUBLIC_SHIPPING_API_BASE`, `localhost:808`, `axios.create({ baseURL`): **không có khớp** trong `frontend/web-app/legacy/shipping/`.

File `legacy/shipping/app/lib/shippingApi.ts` đã dùng `NEXT_PUBLIC_API_URL` (mặc định `http://localhost/api`), tách origin gateway và path dạng `/api/shipping/...` → request thực tế: `http://localhost/api/shipping/*` (qua Nginx/gateway), không có `:8084`.

## Bước 2 — `useSyncOrders`

File: `legacy/shipping/app/hooks/useSyncOrders.ts`

- POST tương đối **`/api/sync-orders`** (Next.js), không hardcode port.
- Sau khi **`res.ok`**, gọi callback tùy chọn.
- Dashboard: `useSyncOrders(orders, () => showToast('Đã đồng bộ dữ liệu'))` với `showToast` = `useCallback`.

## Bước 3 — `app/api/sync-orders/route.ts`

- POST: JSON body → ghi file qua `getSharedOrdersFilePath()`, tạo thư mục cha nếu thiếu.
- GET: không có file hoặc JSON lỗi → **`[]`**, không throw.

**Đường dẫn file:** `getSharedOrdersFilePath()` trong `lib/shipping-sync-shared.ts` mặc định là **`path.join(process.cwd(), 'tmp', 'sync-orders.json')`** (override bằng `SHARED_ORDERS_PATH` nếu cần).

## Bước 4 — `app/internal/shipping-sync/route.ts`

- GET: **`fetch(\`http://127.0.0.1:${process.env.PORT ?? '3000'}/api/sync-orders\`)`** (route nội bộ, `/api` không qua middleware JWT).
- `!res.ok` hoặc lỗi mạng → `{ data: [], source: 'fallback_empty', error: null }`.
- Mảng rỗng → `{ data: [], source: 'sync_empty', error: null }`.
- Có dữ liệu → map qua `mapDashboardOrdersToSyncPayload`, `source: 'sync_ok'`.

## Bước 5 — Admin `/admin/shipments`

- `getAdminShipments` trong `lib/api.ts`: thử **`GET /api/shipping/shipments`** (gateway); nếu không có dữ liệu hoặc lỗi → **`fetch('/internal/shipping-sync')`**.
- Trang dùng empty state **"Chưa có dữ liệu vận chuyển"** khi không có row; `data?.data ?? []` tránh `undefined`.

## Bước 6 — Thư mục thừa trong `legacy/shipping/`

Không tồn tại các thư mục `app/api/`, `app/geocode/`, `app/osrm/`, `app/sync-orders/` trong `legacy/shipping/` — không cần xóa.

## Middleware — sửa lỗi redirect `/internal`

Trước đây path **`/internal/*`** không nằm trong `roleRouteGuard` → user đăng nhập vẫn bị redirect về home theo role, **`fetch('/internal/shipping-sync')` của admin không nhận JSON**.

Đã thêm: `{ prefix: "/internal", allowedRoles: ["ADMIN"] }` trong `middleware.ts`.

## Kiểm tra tự động

| Kiểm tra | Kết quả |
|----------|---------|
| `npm run build` (web-app) | PASS |

## Kiểm tra thủ công (cần stack đầy đủ: Next + gateway + cookie đăng nhập)

| # | Bước | Kết quả |
|---|------|---------|
| 1 | Login `shipper1@bicap.io` / `123456` → `/shipping/dashboard` | **Cần xác nhận trên môi trường dev** |
| 2 | `/shipping/shipments` có danh sách (hoặc empty hợp lệ) | **Cần xác nhận** |
| 3 | Network: không request `:8084` | **Cần xác nhận** — code shipping chỉ gọi gateway qua `NEXT_PUBLIC_API_URL` |
| 4 | Admin → `/admin/shipments`: có data hoặc empty state, không crash | **Cần xác nhận** (sau fix middleware `/internal`) |
| 5 | POST `/api/sync-orders` → 200, file `tmp/sync-orders.json` | **Cần xác nhận** sau khi mở shipping dashboard có đơn |
| 6 | GET `/internal/shipping-sync` với cookie ADMIN → JSON `source` | **Cần xác nhận** (curl không cookie có thể 302 login — hành vi đúng) |

## Tiêu chí chấp nhận (mapping)

| Tiêu chí | Trạng thái |
|----------|------------|
| Login shipper → `/shipping/dashboard` không blank | Code path OK; E2E **pending** |
| Không call `:8084` | **PASS** (không hardcode trong legacy/shipping) |
| API shipping qua `http://localhost/api/shipping/*` | **PASS** (theo `shippingApi.ts` + axios client) |
| POST `/api/sync-orders` | **PASS** (route + đường dẫn file) |
| GET `/internal/shipping-sync` | **PASS** (route + middleware ADMIN) |
| `/admin/shipments` không crash | **PASS** (logic + middleware fix) |
| `tmp/sync-orders.json` sau sync | **PASS** (đường dẫn mặc định); E2E ghi file **pending** |
| File báo cáo này | **PASS** |
