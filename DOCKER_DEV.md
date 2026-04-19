# BICAP Local Dev (Docker + DB dependencies)

Mục tiêu: chạy `make up` là đủ các hạ tầng/DB cần thiết để bạn start từng service bằng:
- `mvn spring-boot:run` (Spring Boot)
- `npm run dev` (NodeJS)

## 1) Hạ tầng Docker (1 nơi duy nhất)

Luôn dùng compose ở root:
- `docker-compose.yml` (dev)

Tránh chạy compose riêng trong từng service (ví dụ `services/*/docker-compose.yml`) vì có thể gây trùng `container_name`/port và làm “lung tung” môi trường.

## 2) Container naming chuẩn

`make up` sẽ chạy các container chính sau:
- Kafka/ZooKeeper: `bicap-kafka`, `bicap-zookeeper`
- Redis: `bicap-redis`
- MySQL: `bicap-mysql` (port `3306`)
- MongoDB: `bicap-mongo` (port `27017`)
- PostgreSQL: `bicap-postgres` (port `5432`) với 2 DB: `shipping_db`, `report_db`
- Monitoring: `bicap-prometheus`, `bicap-grafana`
- Nifi: `bicap-nifi`

## 3) Mapping Service -> DB

- `identity-service` -> MySQL (`identity_db`, `localhost:3306`)
- `farm-service` -> MongoDB (`farm_db`, `localhost:27017`)
- `retailer-service` -> MongoDB (`retailer_db`, `localhost:27017`)
- `shipping-service` -> PostgreSQL (`shipping_db`, `localhost:5432`)
- `report-service` -> PostgreSQL (`report_db`, `localhost:5432`) (hiện service chưa có code)
- `api-gateway` -> Redis (Kafka/Redis chạy sẵn)

## 4) Chạy lệnh chuẩn

### 4.1) Start DB/Infrastructure

```bash
make up
```

Sau khi up xong, chạy tạo topic Kafka (vì `KAFKA_AUTO_CREATE_TOPICS_ENABLE=false`):

```bash
make topics
```

### 4.2) Verify hạ tầng đã UP

```bash
make verify
```

Expected: các phần Kafka/Redis/MySQL/Mongo/Postgres đều pass.

## 5) Start từng service (chạy local để dev)

- `api-gateway` (Spring Boot):
  ```bash
  cd services/api-gateway
  mvn spring-boot:run
  ```

- `identity-service` (Spring Boot):
  ```bash
  cd services/identity-service
  mvn spring-boot:run
  ```

- `shipping-service` (Spring Boot):
  ```bash
  cd services/shipping-service
  mvn spring-boot:run
  ```

- `farm-service` (NodeJS):
  ```bash
  cd services/farm-service
  npm run dev
  ```
  (Nếu file `.env` chưa tồn tại thì copy từ `.env.example` sang `.env`.)

- `retailer-service` (NodeJS):
  ```bash
  cd services/retailer-service
  npm run dev
  ```
  (Nếu file `.env` chưa tồn tại thì copy từ `.env.example` sang `.env`.)

## 6) Check health (để thấy “UP”)

- `identity-service`:
  - `GET http://localhost:8081/actuator/health`
- `shipping-service`:
  - `GET http://localhost:8084/actuator/health`
- `farm-service`:
  - `GET http://localhost:8082/health` (trả về `{ "status": "UP" }`)
- `retailer-service`:
  - `GET http://localhost:8083/health` (trả về `{ "status": "UP" }`)

Nếu bạn đang chạy `api-gateway`, có endpoint tổng hợp:
- `GET http://localhost:8080/api/gateway/health`

