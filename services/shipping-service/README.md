# Shipping Service

## Chức năng
- Quản lý shipment lifecycle và lịch sử trạng thái giao nhận.
- API cho driver pickup/cập nhật trạng thái theo shipment.
- Consume Kafka `bicap.order.confirmed` để khởi tạo shipping flow.

## Port
- `8084`

## Swagger / OpenAPI
- Swagger UI: `http://localhost:8084/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8084/v3/api-docs`

## API Endpoints chính
- `POST /api/shipping/shipments`
- `GET /api/shipping/shipments`, `GET /api/shipping/shipments/{id}`
- `GET /api/shipping/shipments/{id}/history`
- `POST /api/shipping/driver/shipments/{id}/pickup`
- `POST /api/shipping/driver/shipments/{id}/status`

## Environment Variables
```env
SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/shipping_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=bicap_user
SPRING_DATASOURCE_PASSWORD=12123
SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:29092
SHIPPING_PORT=8084
```

## Chạy local nhanh
```bash
cd services/shipping-service
mvn spring-boot:run
```
