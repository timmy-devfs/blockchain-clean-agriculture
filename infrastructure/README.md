# BICAP Infrastructure

Hạ tầng cho dự án **BICAP (Blockchain Integration in Clean Agricultural Production)** theo kiến trúc microservices. Thư mục này tập trung vào việc cung cấp môi trường **local development** đồng nhất cho toàn team, đồng thời giữ cấu trúc đủ gần với định hướng **production** để giảm sai khác khi triển khai.

## 1) Tổng quan (Overview)

Mục tiêu của `infrastructure`:

- Cung cấp stack chạy local bằng Docker cho toàn bộ team backend/frontend/DevOps.
- Chuẩn hóa các thành phần nền tảng: messaging, cache, database, data-flow automation, observability, edge proxy.
- Hỗ trợ verify nhanh trạng thái hệ thống bằng `make` commands (`up`, `topics`, `verify`, `down`...).
- Làm baseline cho môi trường production (Nginx SSL, observability, flow data integration).

## 2) Kiến trúc hạ tầng (Infrastructure Components)

### 2.1 Runtime & Networking

- **Docker Compose**: orchestration toàn bộ services.
- **Bridge network**: `bicap-network` để các container giao tiếp nội bộ.
- **Persistent volumes**: tách data từng thành phần (`kafka-data`, `redis-data`, `mysql-data`, `postgres-data`, ...).

### 2.2 Kafka + Zookeeper

- **Kafka** (`confluentinc/cp-kafka:7.5.0`) là event backbone giữa các microservices.
- **Zookeeper** dùng để quản lý metadata/broker state cho Kafka.
- Kafka tắt auto-create topic (`KAFKA_AUTO_CREATE_TOPICS_ENABLE=false`) để kiểm soát schema/event contract tốt hơn.

**9 topics chuẩn của BICAP** (`infrastructure/kafka/create-topics.sh`):

1. `bicap.season.created`: farm-service phát sự kiện tạo mùa vụ mới.
2. `bicap.season.updated`: cập nhật thông tin mùa vụ.
3. `bicap.season.exported`: đánh dấu mùa vụ đã export/chốt dữ liệu.
4. `bicap.order.placed`: retailer/public đặt đơn hàng.
5. `bicap.order.confirmed`: đơn hàng được xác nhận.
6. `bicap.order.delivered`: đơn hàng đã giao thành công.
7. `bicap.shipment.updated`: cập nhật trạng thái vận chuyển.
8. `bicap.payment.success`: sự kiện thanh toán thành công.
9. `bicap.iot.alert`: cảnh báo bất thường từ dữ liệu IoT.

Thông số topic mặc định:

- Partitions: `3`
- Replication factor: `1` (local)
- Retention: `7 ngày` (`retention.ms=604800000`)

### 2.3 Redis

Redis chạy theo cấu hình tại `infrastructure/redis/redis.conf`:

- `maxmemory 256mb`
- `maxmemory-policy allkeys-lru`
- `maxmemory-samples 5`

Ý nghĩa:

- Redis giữ vai trò cache/tạm dữ liệu nóng (session, token blacklist, short-lived state, IoT realtime buffers).
- Khi dùng quá `256MB`, key sẽ bị evict theo **LRU trên toàn bộ keys** (`allkeys-lru`) để tránh OOM container.
- Persistence dev-friendly: RDB snapshots bật, AOF đang tắt (`appendonly no`) để nhẹ tài nguyên local.

### 2.4 Databases (Local vs Production Mapping)

#### Local hiện tại trong Docker Compose

- **MySQL 8.0** (`bicap-mysql`): cấp phát nhiều DB logic qua `infrastructure/mysql/init.sql`:
  - `identity_db`
  - `notification_db`
  - `guest_db`
  - `blockchain_db`
- **PostgreSQL 15** (`bicap-postgres`):
  - `shipping_db` (default)
  - `report_db` (tạo thêm bằng init script)
- **MongoDB 7.0** (`bicap-mongo`): phục vụ các service theo cấu hình ứng dụng (ví dụ farm/retailer/iot/payment).

#### Định hướng Production theo tài liệu dự án

- nhóm domain identity/auth -> `identity_db`
- nhóm notification -> `notification_db`
- nhóm guest/public -> `guest_db`
- nhóm blockchain metadata -> `blockchain_db`
- nhóm shipping/reporting -> `shipping_db`, `report_db`

> Lưu ý: trong `infrastructure` team đang dùng MySQL/Postgres/Mongo để chạy local nhanh và nhẹ hơn.

### 2.5 NiFi Flows

Các template flow nằm tại `infrastructure/nifi/flows`:

- `farm-to-blockchain.xml`  
  Theo dõi `bicap.season.created` trên Kafka, đợi blockchain xử lý, gọi trace API và route success/alert (đảm bảo ghi chain có `txHash`).
- `iot-to-redis.xml`  
  Trigger mỗi 5 phút, lấy dữ liệu cảm biến từ IoT API và đẩy vào iot-service để cập nhật dữ liệu realtime/cache.
- `db-sync.xml`  
  Chạy lịch 01:00 AM để đồng bộ dữ liệu vận hành sang vùng báo cáo (`report_db`) phục vụ analytics/audit.

### 2.6 Edge + Monitoring

- **Nginx**
  - `nginx.dev.conf`: reverse proxy local (`/api` -> API Gateway), route các web apps theo subdomain localhost.
  - `nginx.prod.conf`: chuẩn bị cho production với HTTPS, security headers, rate limit.
- **Prometheus**: scrape `/actuator/prometheus` của các Spring Boot services.
- **Grafana**: dashboard hóa metrics (đăng nhập mặc định `admin/admin` trong local).

## 3) Hướng dẫn khởi chạy (How to run)

Thực thi từ root project:

### 3.1 Khởi động hạ tầng

```bash
make up
```

Tương đương:

```bash
docker-compose up -d
```

### 3.2 Tạo Kafka topics (bắt buộc sau lần đầu chạy)

```bash
make topics
```

### 3.3 Verify toàn bộ services

```bash
make verify
```

### 3.4 Xem trạng thái & logs

```bash
make ps
make logs
make logs-kafka
```

### 3.5 Dừng / reset hệ thống

```bash
make down    # stop containers, giữ volumes
make clean   # stop + xóa volumes (reset data)
```

## 4) Cấu hình môi trường (Environment Variables & Exposed Ports)

Các cổng public expose từ host (dùng để cấu hình `.env` local cho services/web):

| Component | Host Port | Internal Port | Ghi chú |
|---|---:|---:|---|
| Zookeeper | 2181* | 2181 | Không map explicit trong compose; dùng nội bộ container (`zookeeper:2181`) |
| Kafka External | 9092 | 9092 | Client chạy trên host kết nối `localhost:9092` |
| Kafka Internal | 29092 | 29092 | Container nội bộ kết nối `kafka:29092` |
| Redis | 6379 | 6379 | Cache layer |
| MySQL | 3306 | 3306 | `bicap-mysql` |
| MongoDB | 27017 | 27017 | `bicap-mongo` |
| PostgreSQL | 5432 | 5432 | `shipping_db`, `report_db` |
| NiFi HTTPS | 8443 | 8443 | UI: `https://localhost:8443` |
| Prometheus | 9090 | 9090 | UI metrics |
| Grafana | 3100 | 3000 | UI dashboard |
| Nginx HTTP | 80 | 80 | Entry point local web/api |
| Nginx HTTPS | 443 | 443 | Dự phòng SSL / prod-like |

\* Zookeeper không expose trực tiếp ra host trong compose hiện tại; port `2181` hiển thị ở đây để team nắm cổng chuẩn nội bộ.

### Gợi ý mapping nhanh cho `.env` local

- Kafka: `KAFKA_BOOTSTRAP_SERVERS=localhost:9092`
- Redis: `REDIS_HOST=localhost`, `REDIS_PORT=6379`
- MySQL: `MYSQL_HOST=localhost`, `MYSQL_PORT=3306`
- MongoDB: `MONGO_URI=mongodb://localhost:27017/<db_name>`
- PostgreSQL: `POSTGRES_HOST=localhost`, `POSTGRES_PORT=5432`