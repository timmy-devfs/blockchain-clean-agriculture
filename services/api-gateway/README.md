# BICAP API Gateway

`api-gateway` là điểm vào duy nhất của hệ thống BICAP cho toàn bộ API phía sau (10 services).  
Trong môi trường triển khai, tầng ngoài là **Nginx** (edge proxy), tầng trong là **Spring Cloud Gateway** (routing, auth, rate limit, resilience).

## Tổng quan kiến trúc (Architecture Overview)

### Vai trò của API Gateway Pattern trong BICAP

- **Single Entry Point**: mọi request API đi qua gateway thay vì gọi trực tiếp từng service.
- **Routing tập trung**: map path prefix (`/api/farm/**`, `/api/pay/**`, ...) tới service đích.
- **Authentication tập trung**: validate JWT một lần tại gateway qua `identity-service` introspect.
- **Header propagation**: forward danh tính người dùng (`X-User-Id`, `X-User-Role`, `X-User-Email`) xuống downstream.
- **Rate limiting tập trung**: chặn flood/brute force theo IP và loại request (anonymous/authenticated).
- **Resilience layer**: circuit breaker + fallback để giảm cascade failure.
- **Observability gateway**: request ID, structured logging, health aggregation endpoint.

### Vị trí trong luồng request

`Client -> Nginx -> Spring Cloud Gateway (:8080) -> Downstream services`

- Nginx xử lý edge concerns (TLS, host routing, reverse proxy).
- Gateway xử lý policy ở tầng application/API.

## Các bộ lọc cốt lõi (Core Filters)

## 1) `AuthenticationFilter`

Mục tiêu: bảo vệ protected APIs bằng introspect JWT và cache kết quả để giảm tải cho `identity-service`.

Luồng xử lý:

1. Kiểm tra whitelist path qua `RouteValidator`.
2. Nếu protected path nhưng thiếu `Authorization: Bearer ...` -> trả `401`.
3. Build cache key dạng `jwt:{sha256(token)}`.
4. Đọc Redis cache:
   - **Cache hit**: parse `IntrospectResponse`; nếu `valid=true` thì forward.
   - **Cache miss**: gọi `POST {identity.service.url}{identity.service.introspect-path}`.
5. Lưu result vào Redis với TTL `gateway.jwt-cache-ttl-seconds` (mặc định `300s` = 5 phút).
6. Nếu token hợp lệ, mutate request và forward với headers:
   - `X-User-Id`
   - `X-User-Role`
   - `X-User-Email`
7. Nếu introspect invalid -> `401`; nếu identity-service lỗi/unreachable -> `503`.

Điểm thiết kế quan trọng:

- Cache key dùng SHA-256 token để tránh lưu token raw trong Redis key.
- Filter này chạy order `-1` (sau `RequestIdFilter`, sau `LoggingFilter`).
- Cấu hình động qua `application.yml`:
  - `identity.service.url`
  - `identity.service.introspect-path`
  - `gateway.jwt-cache-ttl-seconds`

## 2) `RateLimitWebFilter`

Mục tiêu: giới hạn số request/phút bằng Redis counter.

Cơ chế:

- Dùng `ReactiveStringRedisTemplate`.
- Tạo key theo cửa sổ phút:
  - anonymous: `rl:anon:{ip}:{minute}`
  - authenticated: `rl:auth:{ip}:{minute}`
- Tăng bộ đếm bằng `INCR`; request đầu tiên sẽ set TTL `90s` để tránh reset sớm.
- So sánh với ngưỡng:
  - anonymous mặc định `100 req/min`
  - authenticated mặc định `500 req/min`
- Vượt ngưỡng -> trả `429` với error code `9003`.
- Thêm response headers:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`

Chi tiết kỹ thuật:

- Ưu tiên lấy client IP từ `X-Forwarded-For`, rồi `X-Real-IP`, fallback remote address.
- Có hỗ trợ bỏ qua path theo `gateway.rate-limit.exclude-paths`.
- Nếu Redis lỗi, filter cho request đi qua (fail-open) để tránh toàn hệ thống bị block do hỏng Redis.

## 3) `RequestIdFilter`

- Gán `X-Request-Id` (UUID) cho mọi request.
- Header được thêm cả vào request xuống downstream và response trả client.
- Dùng để trace xuyên service, gom log nhanh theo request chain.
- Order `-2`.

## 4) `LoggingFilter`

- Ghi log cho mỗi request: `method`, `path`, `status`, `latency(ms)`.
- Chạy sớm nhất trong nhóm GlobalFilter (order `-3`) để đo full thời gian xử lý end-to-end tại gateway.

## Bảng định tuyến (Routing Table)

Routes được khai báo trong `application.yml`:

| Route ID | Path Predicate | Downstream URI | Circuit Breaker |
|---|---|---|---|
| `identity-service` | `/api/auth/**` | `http://localhost:8081` | `identity-cb` |
| `farm-service` | `/api/farm/**` | `http://localhost:8082` | `farm-cb` |
| `retailer-service` | `/api/retail/**` | `http://localhost:8083` | `retailer-cb` |
| `shipping-service` | `/api/shipping/**` | `http://localhost:8084` | `shipping-cb` |
| `notification-service` | `/api/notify/**` | `http://localhost:8085` | `notification-cb` |
| `payment-service` | `/api/pay/**` | `http://localhost:8086` | `payment-cb` |
| `iot-service` | `/api/iot/**` | `http://localhost:8087` | `iot-cb` |
| `report-service` | `/api/reports/**` | `http://localhost:8088` | `report-cb` |
| `guest-service` | `/api/public/**` | `http://localhost:8089` | `guest-cb` |
| `blockchain-service` | `/api/chain/**` | `http://localhost:8090` | `blockchain-cb` |

Ghi chú:

- `farm-service` có thêm header `X-Gateway-Source: bicap-gateway`.
- Gateway bật global CORS cho các web app local (`3000` -> `3004`).

## Xử lý sự cố (Resilience)

## 1) Circuit Breaker (Resilience4j)

Cấu hình mặc định:

- `sliding-window-size: 10`
- `failure-rate-threshold: 50`
- `wait-duration-in-open-state: 10s`
- `permitted-number-of-calls-in-half-open-state: 3`

Riêng `blockchain-cb` nới lỏng hơn:

- `failure-rate-threshold: 60`
- `wait-duration-in-open-state: 20s`

Mỗi route gắn `CircuitBreaker` filter với `fallbackUri: forward:/fallback/{service}`.

## 2) Fallback Strategy

`FallbackController` trả về HTTP `503` chuẩn hóa:

```json
{
  "code": 9002,
  "message": "<service> service is temporarily unavailable. Please try again later.",
  "data": {}
}
```

Giúp client nhận lỗi nhất quán thay vì timeout/stacktrace không kiểm soát.

## 3) Global Error Handling

`GlobalErrorHandler` chuẩn hóa lỗi toàn gateway theo format:

```json
{
  "code": <bicap_error_code>,
  "message": "<human_readable_message>",
  "data": null
}
```

Mapping chính:

- `429` -> `9003` (rate limit exceeded)
- `503` -> `9002` (service unavailable)
- `504` -> `9005` (upstream timeout)
- mặc định -> `9001` (internal server error)

## Thông tin vận hành nhanh

- Gateway port: `8080`
- Health aggregate endpoint: `GET /api/gateway/health`
- Actuator exposure: `health`, `info`, `metrics`, `gateway`
- Redis requirement: `spring.data.redis.host/port` (mặc định `localhost:6379`)
- Identity introspect config:
  - `identity.service.url`
  - `identity.service.introspect-path`

## Tech Stack

- Spring Boot 3.5
- Spring Cloud Gateway (Reactive/WebFlux)
- Reactive Redis
- Resilience4j Circuit Breaker
- Spring Actuator
- WebClient (introspect call)