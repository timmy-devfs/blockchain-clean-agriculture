# Shipping Service - BICAP

## Cách chạy project

### Bước 1: Khởi động PostgreSQL và Kafka bằng Docker
```bash
docker-compose up -d
```
> Chờ khoảng 30 giây để các service khởi động xong

### Bước 2: Chạy Spring Boot
```bash
mvn spring-boot:run
```
Hoặc mở VS Code → tìm file `ShippingApplication.java` → nhấn nút ▶ Run

### Bước 3: Kiểm tra service còn sống
Mở trình duyệt, vào: http://localhost:8084/actuator/health

Nếu thấy `{"status":"UP"}` là thành công ✅

---

## Cấu trúc project

```
shipping-service/
├── src/main/java/com/bicap/shipping/
│   ├── ShippingApplication.java       ← Điểm khởi động
│   ├── config/
│   │   ├── SecurityConfig.java        ← Cấu hình bảo mật
│   │   ├── GatewayHeaderFilter.java   ← Đọc X-User-Id, X-User-Role
│   │   ├── KafkaProducerConfig.java   ← Gửi event: bicap.shipment.updated
│   │   └── KafkaConsumerConfig.java   ← Nhận event: bicap.order.confirmed
│   ├── entity/
│   │   ├── Driver.java                ← Bảng tài xế
│   │   ├── Vehicle.java               ← Bảng xe
│   │   ├── Shipment.java              ← Bảng chuyến hàng
│   │   ├── ShipmentStatusHistory.java ← Bảng lịch sử trạng thái
│   │   └── ShippingReport.java        ← Bảng báo cáo vận chuyển
│   ├── constant/
│   │   ├── ShipmentStatus.java        ← Enum 7 trạng thái
│   │   └── VehicleType.java           ← Enum 4 loại xe
│   └── common/
│       ├── ApiResponse.java           ← Chuẩn hóa response API
│       └── ErrorCode.java             ← Mã lỗi 4xxx
├── src/main/resources/
│   ├── application.yml                ← Cấu hình chính
│   └── db/migration/
│       ├── V1__create_drivers.sql
│       ├── V2__create_vehicles.sql
│       ├── V3__create_shipments.sql
│       ├── V4__create_shipment_status_history.sql
│       └── V5__create_shipping_reports.sql
├── docker-compose.yml                 ← Chạy PostgreSQL + Kafka
└── pom.xml                            ← Khai báo thư viện
```

---

## Acceptance Criteria

- [x] `mvn clean compile` không lỗi, Spring context load thành công
- [x] Kết nối `shipping_db` thành công
- [x] Flyway: 5 migration files, 5 bảng được tạo đúng foreign keys
- [x] ShipmentStatus enum: 7 giá trị (CREATED → DELIVERED/CANCELLED)
- [x] VehicleType enum: 4 giá trị (TRUCK, VAN, MOTORBIKE, REFRIGERATED_TRUCK)
- [x] Kafka consumer group đăng ký consume topic `bicap.order.confirmed`
- [x] GET `/actuator/health` trả về `{status: UP}`
