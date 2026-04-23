# 🌿 BICAP System
**Blockchain Integration in Clean Agricultural Production**

Hệ thống truy xuất nguồn gốc nông sản theo kiến trúc microservices, tích hợp Kafka, Redis, MySQL, MongoDB và blockchain service.

## Architecture

```text
Web / Mobile Clients
        |
     API Gateway (:8080)
        |
  -----------------------------------------
  | identity | farm | retailer | shipping |
  | notify   | payment | iot | report    |
  | guest    | blockchain               |
  -----------------------------------------
        |
 Infrastructure: Kafka + Redis + MySQL + Mongo + Nginx + Prometheus + Grafana
```

## Tech Stack

| Layer | Main technologies |
|---|---|
| Backend services | Java Spring Boot 3.x, Node.js TypeScript |
| Frontend apps | Next.js, React |
| API Docs | SpringDoc OpenAPI, Swagger UI Express |
| Messaging | Apache Kafka |
| Cache | Redis |
| Databases | MySQL, MongoDB |
| Gateway | Spring Cloud Gateway |
| Observability | Prometheus, Grafana |
| Containerization | Docker, Docker Compose |

## Docker Compose Strategy

Repository dùng 3 file compose riêng theo môi trường:

- `docker-compose.yml`: dev cũ (giữ nguyên để tương thích workflow hiện tại của team).
- `docker-compose.demo.yml`: chạy full stack local để demo trên 1 máy.
- `docker-compose.prod.yml`: chạy production/staging với `.env.prod`, resource limits và logging chuẩn.

Không gộp 3 file vào 1 file duy nhất để tránh trộn config giữa dev/demo/prod.

## Requirements

- Docker Desktop
- Docker Compose v2+
- Node.js 18+ (nếu chạy frontend local bằng `npm`/`pnpm`)
- Java 17+ (nếu chạy service local không qua Docker)

## Run Full Stack (Demo Local)

```bash
docker-compose -f docker-compose.demo.yml config
docker-compose -f docker-compose.demo.yml up -d --build
docker-compose -f docker-compose.demo.yml ps
```

Hoặc dùng Makefile:

```bash
make demo-build
make demo-up
make demo-topics
make demo-ps
```

Health endpoint:

- Nginx: [http://localhost/nginx-health](http://localhost/nginx-health)

## API Documentation (BIC-043)

Swagger/OpenAPI cho 5 service chính đã được expose qua Gateway + Nginx:

- Identity: [http://localhost/docs/identity/swagger-ui/index.html](http://localhost/docs/identity/swagger-ui/index.html)
- Farm: [http://localhost/docs/farm/swagger-ui](http://localhost/docs/farm/swagger-ui)
- Retailer: [http://localhost/docs/retailer/swagger-ui](http://localhost/docs/retailer/swagger-ui)
- Shipping: [http://localhost/docs/shipping/swagger-ui/index.html](http://localhost/docs/shipping/swagger-ui/index.html)
- Notification: [http://localhost/docs/notification/swagger-ui/index.html](http://localhost/docs/notification/swagger-ui/index.html)

OpenAPI specs được lưu tại:

- `docs/05-api-design/identity.openapi.yaml`
- `docs/05-api-design/farm.openapi.yaml`
- `docs/05-api-design/retailer.openapi.yaml`
- `docs/05-api-design/shipping.openapi.yaml`
- `docs/05-api-design/notification.openapi.yaml`

Quick verify:

```bash
curl -I http://localhost/docs/farm/swagger-ui
curl -I http://localhost/docs/retailer/swagger-ui
curl -I http://localhost/docs/identity/swagger-ui/index.html
curl -I http://localhost/docs/shipping/swagger-ui/index.html
curl -I http://localhost/docs/notification/swagger-ui/index.html
```

Stop stack:

```bash
docker-compose -f docker-compose.demo.yml down
```

## Run Production-like Stack

```bash
docker-compose --env-file .env.prod -f docker-compose.prod.yml config
docker-compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
docker-compose --env-file .env.prod -f docker-compose.prod.yml ps
```

Stop stack:

```bash
docker-compose --env-file .env.prod -f docker-compose.prod.yml down
```

## Run Frontend in Local Dev Mode

Nếu bạn cần vòng lặp code nhanh cho UI, có thể chỉ chạy backend/infrastructure bằng Docker, còn frontend chạy local:

```bash
cd frontend
pnpm install
pnpm --filter bicap-web-admin dev
```

Hoặc với app dùng `npm`:

```bash
cd frontend/web-public
npm install
npm run dev
```

## Shipping Service Cleanup (One-time)

`shipping-service` đã được chuẩn hóa lại migration sang MySQL (không dùng workaround tắt Flyway nữa).

Nếu máy của bạn từng chạy bản cũ và bị lỗi Flyway history, reset riêng DB `shipping_db` một lần:

```bash
docker exec bicap-mysql mysql -uroot -p12123 -e "DROP DATABASE IF EXISTS shipping_db; CREATE DATABASE shipping_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL PRIVILEGES ON shipping_db.* TO 'bicap_user'@'%'; FLUSH PRIVILEGES;"
docker-compose -f docker-compose.demo.yml up -d shipping-service
```

## Pre-push Checklist (Docker/DevOps)

```bash
docker-compose -f docker-compose.demo.yml config
docker-compose --env-file .env.prod -f docker-compose.prod.yml config
docker-compose -f docker-compose.demo.yml build shipping-service notification-service api-gateway
docker-compose -f docker-compose.demo.yml ps
```

Mục tiêu trước khi push:

- Build pass cho các service chính.
- Container chạy với non-root user.
- Healthcheck của các service chuyển sang `healthy`.
- Nginx route được và `/nginx-health` trả về `{"status":"UP"}`.

## Test Runbook (BIC-038 + BIC-043)

Runbook chi tiết để test end-to-end nằm tại:

- `docs/BIC-038-043-TEST-RUNBOOK.md`