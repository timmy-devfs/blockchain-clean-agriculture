# BICAP System

Blockchain Integration in Clean Agricultural Production (microservices + API Gateway).

## 1) Kien truc tong quan

```text
Web / Mobile Clients
        |
      Nginx (:80)
        |
 API Gateway (:8080)
        |
 ---------------------------------------------------------
 | identity | farm | retailer | shipping | report | ... |
 ---------------------------------------------------------
        |
 Infrastructure: Kafka, Redis, MySQL, MongoDB, PostgreSQL
```

## 2) Tai lieu chinh

- Docker + API Gateway test flow (auth, cache, CORS, rate-limit):
  - `docs/API_GATEWAY_TEST_RUNBOOK.md`
- OpenAPI specs:
  - `docs/05-api-design/`

> `DOCKER_DEV.md` da duoc gom vao README nay de tranh trung lap.

## 3) Yeu cau

- Docker Desktop
- Docker Compose v2+
- (Optional) Node.js 18+, Java 17+ khi chay service local khong qua Docker

## 4) Chay demo stack nhanh

```bash
docker compose up -d --build
make make-topics
docker compose ps
```

Health check:

```bash
curl http://localhost/nginx-health
curl http://localhost:8080/actuator/health
```

## 5) URL web demo

- Public: `http://localhost`
- Admin: `http://admin.localhost`
- Farm: `http://farm.localhost`
- Retailer: `http://retail.localhost`
- Shipping: `http://shipping.localhost`

## 6) Swagger docs (qua Gateway/Nginx)

- `http://localhost/docs/identity/swagger-ui/index.html`
- `http://localhost/docs/farm/swagger-ui`
- `http://localhost/docs/retailer/swagger-ui`
- `http://localhost/docs/shipping/swagger-ui/index.html`
- `http://localhost/docs/notification/swagger-ui/index.html`

## 7) Chay prod-like stack (optional)

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

## 8) Stop stack

```bash
docker compose down
```