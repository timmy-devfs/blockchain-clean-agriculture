#Requires -Version 5.1
<#
.SYNOPSIS
  Xóa user demo + Redis JWT cache để chạy lại luồng web (/setup → farm → admin) từ đầu.

.DESCRIPTION
  - MySQL identity_db: DELETE users demo (mở rộng danh sách như trang /setup).
  - Redis: FLUSHALL (token cũ hết hiệu lực — bắt buộc sau khi xóa user).
  - Tùy chọn -ClearMongo: xóa Farm / FarmingSeason / MarketplaceListing trong farm_db (Mongo).

  Sau đó: mở http://localhost:3000/setup → tạo lại tài khoản + seed (nếu có).

.EXAMPLE
  .\scripts\reset-bicap-web-e2e.ps1
  .\scripts\reset-bicap-web-e2e.ps1 -ClearMongo
#>
param(
  [switch] $ClearMongo
)

$ErrorActionPreference = "Stop"

$emails = @(
  "admin@bicap.io",
  "farm1@bicap.io",
  "retail1@bicap.io",
  "shipper1@bicap.io"
)
$sqlIn = ($emails | ForEach-Object { "'$_'" }) -join ","
$sql = "DELETE FROM users WHERE email IN ($sqlIn);"

Write-Host "==> MySQL: $sql" -ForegroundColor Cyan
docker exec bicap-mysql mysql -u root -p12123 identity_db -e $sql

Write-Host "==> Redis FLUSHALL" -ForegroundColor Cyan
docker exec bicap-redis redis-cli FLUSHALL | Out-Null

if ($ClearMongo) {
  Write-Host "==> Mongo: xóa Farm, FarmingSeason, MarketplaceListing (farm_db)" -ForegroundColor Cyan
  $js = @"
db.Farm.deleteMany({});
db.FarmingSeason.deleteMany({});
db.MarketplaceListing.deleteMany({});
"@
  docker exec bicap-mongo mongosh farm_db --quiet --eval $js
}

Write-Host ""
Write-Host "Xong. Bước tiếp theo:" -ForegroundColor Green
Write-Host "  1) Stack: docker compose ps (nginx, gateway, bicap-farm healthy)"
Write-Host "  2) Kafka: make make-topics ; docker compose restart blockchain-service"
Write-Host "  3) Trình duyệt: http://localhost:3000/setup (KHÔNG dùng 127.0.0.1 — cookie SameSite)"
Write-Host "  4) Đăng ký demo → Seed → Login farm1@bicap.io → /farm/dashboard"
