# Retailer Service

## Chức năng
- Retailer marketplace browsing và đặt hàng.
- Theo dõi luồng đơn hàng, callback thanh toán và hủy đơn.
- QR provenance scan, profile update và gửi báo cáo retailer.

## Port
- `8083`

## Swagger / OpenAPI
- Swagger UI: `http://localhost:8083/api-docs`
- OpenAPI JSON: `http://localhost:8083/api-docs.json`

## API Endpoints chính
- `GET /api/retail/marketplace/products`
- `POST /api/retail/orders`, `GET /api/retail/orders`, `DELETE /api/retail/orders/{orderId}/cancel`
- `POST /api/retail/qr/scan`
- `GET /api/retail/orders/{orderId}/shipping`
- `GET /api/retail/profile`, `PUT /api/retail/profile`

## Environment Variables
```env
MONGODB_URI=mongodb://mongo:27017/retailer_db
MONGODB_DB_NAME=retailer_db
KAFKA_BROKERS=kafka:29092
FARM_SERVICE_BASE_URL=http://farm-service:8082
BLOCKCHAIN_SERVICE_BASE_URL=http://blockchain-service:8090
SHIPPING_SERVICE_BASE_URL=http://shipping-service:8084
REPORT_SERVICE_BASE_URL=http://report-service:8088
PORT=8083
```

## Chạy local nhanh
```bash
cd services/retailer-service
npm install
npm run dev
```