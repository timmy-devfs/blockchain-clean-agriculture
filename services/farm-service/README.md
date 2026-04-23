# Farm Service

## Chức năng
- Quản lý Farm profile và giấy phép kinh doanh.
- Quản lý Season lifecycle, export season và phát sự kiện Kafka.
- Quản lý marketplace listing, package/subscription và farm order confirmation.

## Port
- `8082`

## Swagger / OpenAPI
- Swagger UI: `http://localhost:8082/api-docs`
- OpenAPI JSON: `http://localhost:8082/api-docs.json`

## API Endpoints chính
- `POST /api/farm/farms`, `GET /api/farm/farms`, `PUT /api/farm/farms/{id}`
- `GET /api/farm/admin/farms`, `PUT /api/farm/admin/farms/{id}/approve`, `PUT /api/farm/admin/farms/{id}/reject`
- `POST /api/farm/seasons`, `GET /api/farm/seasons`, `POST /api/farm/seasons/{id}/export`
- `POST /api/farm/marketplace/listings`, `GET /api/farm/marketplace/listings`, `DELETE /api/farm/marketplace/listings/{id}`

## Environment Variables
```env
DATABASE_URL=mongodb://mongo:27017/farm_db
KAFKA_BROKERS=kafka:29092
REDIS_URL=redis://redis:6379
PORT=8082
```

## Chạy local nhanh
```bash
cd services/farm-service
npm install
npm run dev
```