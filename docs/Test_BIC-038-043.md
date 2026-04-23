# BIC-038 & BIC-043 Test Runbook

Runbook này gom các bước test nhanh để xác nhận:

- **BIC-038**: Docker/demo/prod stack chạy ổn, healthcheck và routing hoạt động.
- **BIC-043**: Swagger/OpenAPI cho 5 service chính hoạt động qua Gateway/Nginx.

## 1) Prerequisites

- Docker Desktop đang chạy.
- Đứng ở root repo: `blockchain-clean-agriculture`.

## 2) BIC-038 - Docker checklist

### 2.1 Validate compose files

```bash
docker-compose -f docker-compose.demo.yml config
docker-compose --env-file .env.prod -f docker-compose.prod.yml config
```

Kỳ vọng: không lỗi parse/yaml.

### 2.2 Build + up demo stack

```bash
docker-compose -f docker-compose.demo.yml up -d --build
docker-compose -f docker-compose.demo.yml ps
```

Kỳ vọng:

- Các container chính `Up`.
- Database/broker chuyển `healthy`.

### 2.3 Create Kafka topics (demo)

```bash
make demo-topics
```

Kỳ vọng: script tạo topic chạy thành công trong `bicap-kafka`.

### 2.4 Verify core health + routing

```bash
curl -I http://localhost/nginx-health
curl -I http://localhost/
```

Kỳ vọng:

- `nginx-health` trả `200`.
- Root route qua Nginx trả `200`.

### 2.5 Optional: production-like smoke test

```bash
docker-compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
docker-compose --env-file .env.prod -f docker-compose.prod.yml ps
```

Kỳ vọng: service lên được theo profile prod-like.

## 3) BIC-043 - Swagger/OpenAPI checklist

## 3.1 Docs UI via Gateway/Nginx

```bash
curl -I http://localhost/docs/identity/swagger-ui/index.html
curl -I http://localhost/docs/farm/swagger-ui
curl -I http://localhost/docs/retailer/swagger-ui
curl -I http://localhost/docs/shipping/swagger-ui/index.html
curl -I http://localhost/docs/notification/swagger-ui/index.html
```

Kỳ vọng: tất cả trả `200`.

### 3.2 OpenAPI endpoints via Gateway/Nginx

```bash
curl -I http://localhost/docs/identity/v3/api-docs
curl -I http://localhost/docs/farm/v3/api-docs
curl -I http://localhost/docs/retailer/v3/api-docs
curl -I http://localhost/docs/shipping/v3/api-docs
curl -I http://localhost/docs/notification/v3/api-docs
```

Kỳ vọng: tất cả trả `200`.

### 3.3 Verify spec files exist

```bash
ls docs/05-api-design
```

Kỳ vọng có đủ 5 file:

- `identity.openapi.yaml`
- `farm.openapi.yaml`
- `retailer.openapi.yaml`
- `shipping.openapi.yaml`
- `notification.openapi.yaml`

Windows CMD equivalent:

```bat
dir docs\05-api-design
```

## 4) Troubleshooting nhanh

### Lỗi 502 đồng loạt từ Nginx

Triệu chứng:

- `http://localhost/nginx-health` trả `200`
- Nhưng `/`, `/docs/*`, `/docs/*/v3/api-docs` trả `502`

Nguyên nhân thường gặp:

- Nginx giữ upstream IP cũ sau khi `api-gateway`/`web-public` bị recreate.

Fix nhanh:

```bash
docker-compose -f docker-compose.demo.yml restart nginx
docker-compose -f docker-compose.demo.yml ps
curl -I http://localhost/
curl -I http://localhost/docs/farm/swagger-ui
```

Nếu vẫn lỗi, chạy lại stack đầy đủ:

```bash
docker-compose -f docker-compose.demo.yml up -d
docker-compose -f docker-compose.demo.yml ps
```

## 5) Stop stack

```bash
docker-compose -f docker-compose.demo.yml down
docker-compose --env-file .env.prod -f docker-compose.prod.yml down
```

---

Nếu bạn chỉ test nhanh trước khi push, chạy tối thiểu:

1. `docker-compose -f docker-compose.demo.yml up -d --build`
2. `docker-compose -f docker-compose.demo.yml ps`
3. 5 lệnh `curl -I` docs ở mục **3.1**
