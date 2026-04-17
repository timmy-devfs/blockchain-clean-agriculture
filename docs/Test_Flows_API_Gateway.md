# Demo Test Flows — API Gateway

## 0) Quy ước & yêu cầu

- **Folder project (root)**: `D:\projects\blockchain-clean-agriculture`
- **Port hạ tầng (Docker)**:
  - Kafka: `localhost:9092`
  - Redis: `localhost:6379`
  - MySQL: `localhost:3306` (identity/guest/notification/blockchain)
  - MongoDB: `localhost:27017` (farm/retailer)
  - PostgreSQL: `localhost:5432` (shipping_db + report_db)
  - Nginx (Layer 1): `http://localhost` (port 80)
- **Port services (chạy local)**:
  - identity-service: `8081`
  - api-gateway: `8080`
  - farm-service: `8082`
  - retailer-service: `8083`
  - shipping-service: `8084`
- **3 terminals**:
  - Terminal A: Docker infrastructure
  - Terminal B: identity-service
  - Terminal C: api-gateway


##
  1.1 Reset trạng thái hệ thống (Idempotency)
  Xóa user admin để đăng ký lại từ đầu
  docker exec bicap-mysql mysql -u root -p12123 identity_db -e "DELETE FROM users WHERE email='admin@bicap.io';"
  docker exec bicap-mysql mysql -u root -p12123 identity_db -e "DELETE FROM users WHERE email='farm@bicap.io';"

  Xóa toàn bộ Cache trong Redis
  docker exec bicap-redis redis-cli FLUSHALL
  
  netstat -ano | findstr :8080
  taskkill /F /PID <Number_PID>

  http://localhost:{PORT}/swagger-ui/index.html


---

## BIC-003 — [INFRA] Docker Compose hạ tầng (Kafka, Redis, MySQL, Mongo, Postgres)

### BIC-003.1 — Reset sạch môi trường (khuyến nghị trước giờ demo)

```bat
cd /d D:\projects\blockchain-clean-agriculture && make clean
```

### BIC-003.2 — Khởi động hạ tầng

```bat
cd /d D:\projects\blockchain-clean-agriculture && make up
```

### BIC-003.3 — Xem trạng thái containers

```bat
cd /d D:\projects\blockchain-clean-agriculture && make ps
```

### BIC-003.4 — Tạo Kafka topics (9 topics chuẩn `bicap.*`)

```bat
cd /d D:\projects\blockchain-clean-agriculture && make topics
```

### BIC-003.5 — Verify nhanh (Makefile)

```bat
cd /d D:\projects\blockchain-clean-agriculture && make verify
```

### BIC-003.6 — Verify thủ công (từng hạ tầng)

Kafka — list topics:

```bat
docker exec bicap-kafka kafka-topics --bootstrap-server localhost:9092 --list
```

Kafka — describe 1 topic:

```bat
docker exec bicap-kafka kafka-topics --bootstrap-server localhost:9092 --describe --topic bicap.season.created
```

Redis — ping:

```bat
docker exec bicap-redis redis-cli ping
```

Redis — xem `maxmemory`:

```bat
docker exec bicap-redis redis-cli CONFIG GET maxmemory
```

MySQL — list DB chuẩn hoá (`*_db`):

```bat
docker exec bicap-mysql mysql -u root -p12123 -e "SHOW DATABASES LIKE '%_db';"
```

Mongo — list dbs (lưu ý: Mongo chỉ hiện DB khi có collection/document):

```bat
docker exec bicap-mongo mongosh --quiet --eval "show dbs"
```

Postgres — list databases (phải có `shipping_db` + `report_db`):

```bat
docker exec bicap-postgres psql -U postgres -c "\l"
```

NiFi — mở UI:

```bat
start https://localhost:8443
```

---

## BIC-004 — [IDENTITY] Khởi tạo identity-service (Entity, Migration, Security)

### BIC-004.1 — Build identity-service

```bat
cd services\identity-service && mvn clean compile && mvn spring-boot:run
cd services\shipping-service && mvn clean compile && mvn spring-boot:run
cd services\api-gateway && mvn clean compile && mvn spring-boot:run
cd services\farm-service && npm install && npm run prisma:generate && npm run db:migrate && npm run dev
cd services\retailer-service && npm install && npm run prisma:generate && npm run prisma:push && npm run dev
```



### BIC-004.3 — Health check DB + app 

```bat
curl http://localhost:8081/actuator/health
curl http://localhost:8080/actuator/health
curl http://localhost/nginx-health

```

---

## BIC-005 — [IDENTITY] Auth API (Register, Login, Refresh Token, Introspect)


### BIC-005.1 — Register 1 user demo

```bat
curl -X POST http://localhost:8081/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"farm1@bicap.io\",\"password\":\"123456\",\"fullName\":\"Nguyen Van A\",\"role\":\"FARM_MANAGER\"}"
```

Expected: code `201`, message `Registered successfully`.

### BIC-005.2 — Login để lấy accessToken + refreshToken

```bat
curl -X POST http://localhost:8081/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"farm1@bicap.io\",\"password\":\"123456\"}"
```

Expected: trả về `accessToken` + `refreshToken`.

### BIC-005.3 — Introspect token (copy accessToken từ bước login, paste vào)

```bat
curl -X POST http://localhost:8081/api/auth/introspect -H "Content-Type: application/json" -d "{\"token\":\"ACCESS_TOKEN\"}"
```

Expected: `valid: true` + có `userId/email/role`.

### BIC-005.4 — Introspect token sai

```bat
curl -X POST http://localhost:8081/api/auth/introspect -H "Content-Type: application/json" -d "{\"token\":\"this.is.fake.token\"}"
```

Expected: `valid: false`.

### BIC-005.5 — Refresh token (rotate)

```bat
curl -X POST http://localhost:8081/api/auth/refresh-token -H "Content-Type: application/json" -d "{\"refreshToken\":\"PASTE_REFRESH_TOKEN_HERE\"}"
```

Expected: trả về cặp token mới.

---

  ## BIC-006 — [IDENTITY] User Profile & Admin CRUD

  > Các endpoint `/api/auth/me|profile|change-password|admin/**` cần header `X-User-Id`/`X-User-Role`.
  > Khi đi qua Gateway (BIC-011/012), Gateway sẽ gắn các header này sau khi introspect JWT.

  ### BIC-006.1 — (Demo nhanh) Gọi trực tiếp identity-service với header giả lập ADMIN

  ```bat
  curl "http://localhost:8081/api/auth/admin/users?page=0&size=10" -H "X-User-Id: demo-admin-id" -H "X-User-Role: ADMIN"
  ```

  Expected: trả về danh sách (hoặc trang rỗng nếu chưa có data) nhưng không bị `INSUFFICIENT_PERM`.

  ---

## BIC-011 + BIC-012 — [GATEWAY] Routing + JWT Filter + Cache + Circuit Breaker + Health

### BIC-011/012.1 — Run api-gateway

```bat
cd /d D:\projects\blockchain-clean-agriculture\services\api-gateway && mvn clean compile && mvn spring-boot:run
```

### BIC-011/012.2 — Gateway actuator health

```bat
curl http://localhost:8080/actuator/health
```

### BIC-012.3 — Gateway health dashboard (ping 10 services)

```bat
curl http://localhost:8080/api/gateway/health
```

Expected: `gateway: UP` và map `services` (service nào chưa chạy sẽ `DOWN`).

### BIC-011/012.4 — Login qua Gateway (route đến identity-service)

```bat
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"farm1@bicap.io\",\"password\":\"123456\"}"
```

Expected: giống login trực tiếp, chứng minh Gateway route đúng.

### BIC-011/012.5 — Test Nginx layer 1 → Gateway → identity-service

Nginx health:

```bat
curl http://localhost/nginx-health
```

Login qua Nginx (đi vào `/api/**`):

```bat
curl -X POST http://localhost/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"farm1@bicap.io\",\"password\":\"123456\"}"
```

### BIC-011/012.6 — Test route bảo vệ (farm route) với/không token

Không token ⇒ phải 401:

```bat
curl -v http://localhost:8080/api/farm/farms
```

Có token ⇒ không bị 401 (nếu farm-service chưa chạy có thể 503/fallback là đúng):

```bat
curl -v http://localhost:8080/api/farm/farms -H "Authorization: Bearer PASTE_ACCESS_TOKEN_HERE"
```

### BIC-012.7 — Test Redis JWT cache (đúng flow: route bảo vệ, không phải introspect path)

> `POST /api/auth/introspect` là whitelist nên không đi qua cache branch của `AuthenticationFilter`.
> Để thấy `Cache MISS/HIT`, hãy gọi route bảo vệ có `Authorization` (ví dụ `/api/farm/farms`).

Set token:

```bat
set TOKEN=PASTE_ACCESS_TOKEN_HERE
```

Lần 1 (kỳ vọng **Cache MISS**):

```bat
curl -v http://localhost:8080/api/farm/farms -H "Authorization: Bearer %TOKEN%"
```

Lần 2 cùng token (kỳ vọng **Cache HIT**):

```bat
curl -v http://localhost:8080/api/farm/farms -H "Authorization: Bearer %TOKEN%"
```

Kiểm tra key cache trong Redis:

```bat
docker exec bicap-redis redis-cli keys "jwt:*"
```

Xem TTL cache (optional):

```bat
for /f %k in ('docker exec bicap-redis redis-cli --raw keys "jwt:*"') do @docker exec bicap-redis redis-cli ttl %k
```

---
    CHỐNG TẤN CÔNG (RATE LIMITING)
    Rate limit 101+ req/phút -> 429 Kỳ vọng: Lệnh sẽ in ra liên tục mã 200. Sau khoảng 100 request, hệ thống sẽ kích hoạt Token Bucket và chuyển sang in mã 429 (Too Many Requests).
    for /L %i in (1,1,110) do curl -s -o /dev/null -w "%{http_code} " http://localhost:8080/api/gateway/health


---

## (Tuỳ chọn) Demo farm-service + retailer-service (MongoDB)

> MongoDB chỉ “hiện DB” trong DBeaver khi đã có collection/document. Nếu muốn demo DB xuất hiện:

Farm — migrate schema + run:

```bat
cd /d D:\projects\blockchain-clean-agriculture\services\farm-service && npm install && npm run prisma:generate && npm run db:migrate && npm run dev
```

Retailer — generate + push + run:

```bat
cd /d D:\projects\blockchain-clean-agriculture\services\retailer-service && npm install && npm run prisma:generate && npm run prisma:push && npm run dev
```

