# BICAP — Public & Admin acceptance (demo checklist)

Generated: 2026-05-02  
Scope: `frontend/web-app` — public landing, trace, articles, admin dashboard & farm approval.

## Automated / build

| Check | Result |
|--------|--------|
| `npm run build` (Next.js 14) | Pass — compile, lint, and typecheck completed without errors |

## Public routes (manual)

| # | URL | Expected | Tester result |
|---|-----|----------|----------------|
| 1 | `http://localhost:3000/public` | No login; Hero + sections load within a few seconds; APIs use `NEXT_PUBLIC_API_URL` (default `http://localhost/api`). Fallback JSON: `/fallback/featured-products.json`, `/fallback/announcements.json`. Empty announcement banner hidden if no data. | Pending |
| 2 | `http://localhost:3000/articles` | List from `GET .../public/articles` or fallback `articles-content` static index; empty API does not crash. | Pending |
| 3 | `http://localhost:3000/trace` | Form: nhập mã → điều hướng `/trace/{mã}`; gợi ý DEMO / SP001 / LH0001-F32L. | Pending |
| 4 | `http://localhost:3000/trace/{qrCode}` | Ưu tiên `GET .../public/trace/{qrCode}`; nếu không có dữ liệu API → fallback demo `public-trace-demo`; 404 hoàn toàn → “Không tìm thấy sản phẩm với mã này”. | Pending |
| 5 | Browser console | No uncaught errors on public routes above | Pending |

## Admin (manual)

| # | Step | Expected | Tester result |
|---|------|----------|----------------|
| 1 | Login `admin@bicap.io` / `123456` | JWT cookie set | Pending |
| 2 | `http://localhost:3000/admin/dashboard` | Four StatCards: Farms đã duyệt, Nhà bán lẻ hoạt động, Đơn hàng hôm nay, Blockchain Txns — numeric values (loading shows “…”); API failure → zeros via `getDashboardStats` catch | Pending |
| 3 | `http://localhost:3000/admin/farms` | Tabs PENDING / APPROVED / REJECTED; ConfirmDialog approve; Reject modal requires non-empty reason; toasts; query invalidation | Pending |
| 4 | `/admin/farms/[id]` | Farm fields; “Quay lại” → `/admin/farms`; PDF panel (`react-pdf`) — demo file `/documents/sample-license.pdf` when no `fileUrl`; load error → “Không thể tải file” | Pending |
| 5 | `http://localhost:3000/admin/reports` | Table loads (empty or data) | Pending |

## Backend notes

- Dashboard JSON: `report-service` `GET /api/reports/admin/dashboard` includes `blockchainTxns` (demo `0` until wired to chain metrics).
- Guest trace: `GET /api/public/trace/{qrCode}` via Gateway; local demo still works without chain.

## Sign-off

| Role | Name | Date |
|------|------|------|
| Tester | Thuan demo | 5/2 |
