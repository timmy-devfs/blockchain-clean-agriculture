# Frontend Handover README

## 1) Muc tieu tai lieu

Tai lieu nay mo ta trang thai **frontend hien tai** sau khi migration ve mo hinh unified web-app, de thanh vien moi co the:

- hieu kien truc nhanh
- chay duoc local/dev stack
- biet nhung thay doi da chot
- biet quy tac khi tiep tuc phat trien/tao PR


## 2) Tong quan kien truc frontend

Frontend trong monorepo gom cac nhom chinh:

- `web-app`: ung dung Next.js 14 App Router trung tam cho web
- `packages/*`: thu vien dung chung (api-client, auth, ui, types...)
- `mobile-*`: mobile apps/doc lap

Web routing hien tai tap trung trong `web-app`:

- Admin: `/admin/*`
- Farm: `/farm/*`
- Retailer: `/retailer/*`
- Shipping: `/shipping/*`
- Public: `/public`, `/articles`, `/products`, `/trace`, `/how-it-works`, `/huong-dan`

API tu browser duoc chuan hoa di qua gateway:

- `NEXT_PUBLIC_API_URL=http://localhost/api`


## 3) Nhung thay doi quan trong da hoan tat

### 3.1 Unified web

- Da gop luong web vao `frontend/web-app`
- Bo tinh trang chia nhieu frontend role app rieng cho demo core
- Middleware role-based duoc chot cho route private/public

### 3.2 API/Gateway convention

- Chuan hoa base URL theo `NEXT_PUBLIC_API_URL`
- Giam loi goi sai host/port, tranh hardcode service port trong browser bundle

### 3.3 Legacy shipping sync fallback (admin shipments)

- Writer: `web-app/app/api/sync-orders/route.ts`
- Reader fallback: `web-app/app/internal/shipping-sync/route.ts`
- UI admin shipments da co empty-state fallback, tranh crash khi data rong/loi

### 3.4 Cleanup duplicate/legacy zones

- Public duplicate app zone da duoc don dep theo huong chi giu route active trong `app/(public)`
- Data dung lai cho public van giu o `web-app/public-site/data`
- Cac web cu da duoc cleanup khoi git tracking trong phase migration


## 4) Cau truc thu muc frontend (tom tat)

```text
frontend/
  README.md                 # file nay
  .gitignore
  package.json
  pnpm-workspace.yaml
  packages/
    README.md
    api-client/
    auth/
    ui/
    types/
  web-app/
    README.md
    app/
      (admin)/
      (farm)/
      (retailer)/
      (shipping)/
      (public)/
      api/sync-orders/
      internal/shipping-sync/
    components/
    legacy/
    lib/
```


## 5) Cai dat va chay nhanh

Tu root repo:

```bash
docker compose up -d --build
make make-topics
```

Tu `frontend`:

```bash
pnpm install
cd web-app
pnpm typecheck
pnpm dev
```

Neu gap loi port 3000 bi chiem (Windows):

```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```


## 6) Bien moi truong quan trong

Trong web-app (build/runtime cho browser):

- `NEXT_PUBLIC_API_URL` (mac dinh mong muon cho demo): `http://localhost/api`

Luu y:

- Bien `NEXT_PUBLIC_*` can dung gia tri dung truoc khi build image
- Neu doi env ma browser van goi URL cu, rebuild `web-app` image


## 7) Verify nhanh sau khi pull code

1) Health:

- `http://localhost/nginx-health`
- `http://localhost:8080/actuator/health`

2) Web smoke:

- `http://localhost/login`
- `http://localhost/public`
- `http://localhost/admin/dashboard`
- `http://localhost/farm/dashboard`
- `http://localhost/retailer/dashboard`
- `http://localhost/shipping/dashboard`

3) Gateway auth sample:

```bash
curl.exe -X POST http://localhost/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@bicap.io\",\"password\":\"123456\"}"
```


## 8) Tai lieu lien quan nen doc cung

Trong `docs/`:

- `API_GATEWAY_TEST_RUNBOOK.txt`
- `FARM_SEASON_BLOCKCHAIN_TEST_FLOW.txt`
- `WEB_APP_MIGRATION_AUDIT_SUMMARY.txt`
- `luong-tong-fe.txt`

Neu team dang dung ten file moi da doi ten local (vi du `WEB_APP_SUM_UPDATE.txt`, `FE_CURRENT_STATUS.txt`...), uu tien doc file moi nhat dang duoc track tren branch hien tai.


## 9) Nguyen tac khi tiep tuc phat trien

- Uu tien code moi trong `web-app` + `packages/*`
- Khong mo rong logic vao khu vuc da cleanup neu khong co ly do ro rang
- Giu convention API qua gateway (`NEXT_PUBLIC_API_URL`)
- Moi thay doi lon can:
  - typecheck pass
  - smoke route role chinh pass
  - cap nhat docs lien quan neu thay doi flow


## 10) Checklist truoc khi tao PR vao develop

- [ ] `pnpm install` OK
- [ ] `pnpm typecheck` (trong `web-app`) OK
- [ ] route login/public/admin/farm/retailer/shipping smoke OK
- [ ] khong hardcode endpoint service port trong browser code
- [ ] docs da cap nhat neu co thay doi flow
- [ ] `git diff origin/develop...HEAD` duoc review ky


## 11) Ket luan

Frontend hien tai da o trang thai co the tiep tuc phat trien on dinh tren mot web-app trung tam.  
Neu ban moi vao du an, hay bat dau tu `web-app`, doc cac docs trong muc 8, va chay checklist muc 10 truoc khi mo PR.

