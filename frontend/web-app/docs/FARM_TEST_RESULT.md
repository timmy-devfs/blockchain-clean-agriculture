# Farm Manager flow — kết quả kiểm tra (BICAP)

**Ngày:** 2026-05-02  
**Môi trường mục tiêu:** `NEXT_PUBLIC_API_URL=http://localhost/api` (Nginx → Gateway :8080)

## Các thay đổi mã nguồn đã áp dụng (BƯỚC 1–5)

| Hạng mục | Kết quả |
|----------|---------|
| `legacy/farm/services/gateway.ts` | `baseURL` = chuỗi env đã chuẩn hóa (giữ `.../api`, không bóc tách origin). Interceptor 401: `isRedirecting`, public auth paths `/auth/login`, `/auth/register`, `/auth/refresh-token` (không còn `/api/auth/...` trong chuỗi so khớp). |
| `legacy/farm/services/farmApi.ts` + `authFarm.ts` | Path tương đối: `/farm/...`, `/auth/...`, `/iot/...`, `/chain/...` — URL thực tế: `http://localhost/api` + path → **không** còn `/api/api/...`. |
| `FarmLegacyConsole.tsx` | Giữ `dynamic(..., { ssr: false })` + `loading` fallback. |
| `app/(farm)/layout.tsx` | `AppShell` với `hideSidebar={true}`, `noContentPadding={true}`, `navItems={[]}`. |
| Các trang `farm/dashboard`, `seasons`, `orders`, `seasons/[id]`, `iot` | `ProtectedRoute` + `allowedRoles={[UserRole.FARM_MANAGER]}`, `Suspense` + fallback khi tải legacy. |
| `legacy/farm/App.tsx` | Không có FarmLogin gate; chỉ `FarmConsole` (đã đúng từ trước). |

## `pnpm typecheck` (web-app, bao gồm `legacy/farm`)

**PASS** — không lỗi TypeScript mới sau các chỉnh sửa.

---

## BƯỚC 6 — Kiểm tra thủ công trình duyệt

Các bước dưới đây **cần** backend (Gateway + farm-service + auth) và trình duyệt; trong phiên agent chỉ xác nhận được build/typecheck, không mô phỏng được đầy đủ login/token và Network tab.

| Bước | Tiêu chí | Ghi chép |
|------|----------|----------|
| 1 | `http://localhost:3000/login` → `farm1@bicap.io` / `123456` | **Cần người thực hiện** sau khi stack chạy |
| 2 | Redirect `/farm/dashboard`, không loop về `/login` | **Cần người thực hiện** |
| 3 | Farm console hiển thị (~5s) | **Cần người thực hiện** |
| 4 | Không có popup đăng nhập trong legacy console | **Cần người thực hiện** (mã đã bỏ FarmLogin; interceptor 401 một lần) |
| 5 | Tạo farm — `POST` tới URL dạng `http://localhost/api/farm/farms` → 200/201 | **Cần người thực hiện** |
| 6 | Tạo season — `POST` … `/api/farm/seasons` → 200/201 | **Cần người thực hiện** |

### Tiêu chí chấp nhận (checklist)

Sau khi chạy `pnpm dev` và stack API, xác nhận:

- [ ] Login farm → `/farm/dashboard` ổn định, không redirect loop
- [ ] Console không lỗi `Cannot read properties of undefined` (trừ lỗi mạng/môi trường)
- [ ] Network: request farm đi tới `http://localhost/api/farm/...` (một segment `/api`)
- [ ] Không chuỗi 401 lặp (interceptor + `isRedirecting`)
