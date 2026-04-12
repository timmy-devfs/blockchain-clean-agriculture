## notification-service (BIC-027)

### Chức năng
- Quản lý device token: lưu MySQL + cache Redis set `tokens:{userId}`
- Consume Kafka events → lookup tokens Redis → push Firebase FCM

### Yêu cầu
- JDK 17
- MySQL có database `notif_db`
- Redis `localhost:6379`
- Kafka `localhost:9092`
- Firebase Admin service account JSON

### Cấu hình Firebase
1. Lấy Service Account Key (Backend)
Truy cập Firebase Console > Project Settings > Service Accounts.
Nhấn Generate new private key.
Lưu file thành service-account.json trong src/main/resources/.

2. Lấy VAPID Key (Frontend)
Tại Project Settings > Cloud Messaging > Web configuration.
Copy chuỗi Key Pair để điền vào index.html.

### Cách đặt `service-account.json`
Đặt file tại:
- `services/notification-service/service-account.json`

Hoặc set env:
- `FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/service-account.json`

### Run (CMD)
```
mvnw.cmd spring-boot:run // docker-compose up -d
```

### Test nhanh bằng CMD
Register token:
```bat
curl -X POST "http://localhost:8085/tokens" ^
  -H "Content-Type: application/json" ^
  -H "X-User-Id: farm-1" ^
  -H "X-User-Role: FARM_MANAGER" ^
  -d "{\"token\":\"token-farm-1\",\"platform\":\"ANDROID\"}"
```

Remove token:
```bat
curl -X DELETE "http://localhost:8085/tokens/token-farm-1" ^
  -H "X-User-Id: farm-1" ^
  -H "X-User-Role: FARM_MANAGER"
```

