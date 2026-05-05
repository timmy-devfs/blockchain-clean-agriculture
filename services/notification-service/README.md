# Notification Service

## Chức năng
- Quản lý device token theo user để push notification.
- Lưu notification, đánh dấu đọc/chưa đọc và thống kê unread.
- Broadcast notification theo role và consume event để push qua Firebase FCM.

## Port
- `8085`

## Swagger / OpenAPI
- Swagger UI: `http://localhost:8085/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8085/v3/api-docs`

## API Endpoints chính
- `POST /api/notify/tokens`, `DELETE /api/notify/tokens/{token}`
- `GET /notifications`, `GET /notifications/unread-count`
- `PUT /notifications/{id}/read`, `PUT /notifications/read-all`
- `DELETE /notifications/{id}`
- `POST /notifications/broadcast`

## Environment Variables
```env
SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/notification_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=bicap_user
SPRING_DATASOURCE_PASSWORD=12123
SPRING_DATA_REDIS_HOST=redis
SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:29092
FIREBASE_SERVICE_ACCOUNT_PATH=/app/service-account.json
PORT=8085
```

## Chạy local nhanh
```bash
cd services/notification-service
mvn spring-boot:run
```

