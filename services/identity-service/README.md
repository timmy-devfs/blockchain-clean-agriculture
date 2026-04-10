# Identity Service - BICAP

`identity-service` là dịch vụ xác thực trung tâm trong hệ thống BICAP microservices, chịu trách nhiệm quản lý tài khoản người dùng, phân quyền theo role, cấp phát JWT access token, xoay vòng refresh token và cung cấp endpoint introspect cho API Gateway.

## Tổng quan (Overview)

Vai trò chính của service:

- Quản lý vòng đời tài khoản: đăng ký, cập nhật profile, đổi mật khẩu, admin quản trị user.
- Cấp phát JWT Access Token cho client sau khi đăng nhập thành công.
- Lưu và quản trị Refresh Token trong DB để hỗ trợ đăng nhập dài hạn an toàn.
- Thu hồi refresh token theo user khi đăng nhập mới hoặc khi rotate token.
- Cung cấp `/api/auth/introspect` để API Gateway validate token trước khi route request sang các service khác.

Kiến trúc xác thực:

- `identity-service` **tự phát hành và kiểm tra chữ ký JWT** (HS256).
- Các endpoint business nội bộ không parse JWT trực tiếp, mà tin cậy header `X-User-Id`, `X-User-Role` do Gateway forward sau introspect.

## Tech Stack

Theo `pom.xml` và source code hiện tại:

- Java `17`
- Spring Boot `3.5.0`
- Spring Web (`spring-boot-starter-web`)
- Spring Security (`spring-boot-starter-security`)
- Spring Data JPA (`spring-boot-starter-data-jpa`)
- Spring Validation (`spring-boot-starter-validation`)
- Spring Actuator (`spring-boot-starter-actuator`)
- JWT: `io.jsonwebtoken` (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`)
- Mapping: MapStruct (`mapstruct`, `mapstruct-processor`)
- DB migration: Flyway (`flyway-mysql`)
- Runtime DB driver: `mysql-connector-j`
- API docs: SpringDoc OpenAPI (`springdoc-openapi-starter-webmvc-ui`)
- Lombok

> Ghi chú kỹ thuật: code hiện tại đang chạy với **MySQL + Flyway MySQL** (không phải SQL Server trong module này).

## Luồng nghiệp vụ chính (Core Business Flows)

### 1) Login / Token Generation

Luồng được implement tại `AuthController` -> `AuthServiceImpl.login(...)`:

1. Nhận `email/password` từ `/api/auth/login`.
2. Tìm user active theo email.
3. Verify mật khẩu bằng BCrypt (`PasswordEncoder.matches`).
4. Revoke toàn bộ refresh token cũ của user (`revokeAllByUserId`).
5. Sinh Access Token JWT chứa claims: `sub(userId)`, `email`, `role`, `type=ACCESS`.
6. Sinh Refresh Token dạng opaque random string.
7. Lưu refresh token mới vào bảng `refresh_tokens`.
8. Trả về `TokenResponse` gồm `accessToken`, `refreshToken`, `expiresIn`, thông tin user.

Ý nghĩa: mỗi lần login sẽ “đăng xuất logic” các phiên refresh token trước đó, giảm rủi ro token reuse.

### 2) Refresh Token Rotation

Luồng tại `AuthController` -> `AuthServiceImpl.refreshToken(...)`:

1. Nhận refresh token từ `/api/auth/refresh-token`.
2. Tra token trong DB.
3. Từ chối nếu token đã revoke hoặc hết hạn.
4. Load user active tương ứng.
5. Revoke token cũ (`is_revoked = true`).
6. Sinh cặp token mới (access + refresh).
7. Persist refresh token mới.
8. Trả về token mới cho client.

Đây là cơ chế **refresh token rotation** đầy đủ: token cũ bị vô hiệu ngay khi đổi token.

### 3) Validate Token (Introspect)

Luồng tại `/api/auth/introspect`:

1. Nhận JWT từ request body.
2. Parse + verify chữ ký + kiểm tra expiry qua `JwtTokenProvider.extractAllClaims(...)`.
3. Nếu hợp lệ: trả `valid=true` cùng `userId`, `email`, `role`.
4. Nếu không hợp lệ/hết hạn/sai chữ ký: trả `valid=false` (không ném exception ra client).

Endpoint này được API Gateway gọi trước khi forward request sang protected APIs.

## Cấu trúc Database (Database Schema)

Schema do Flyway quản lý trong `src/main/resources/db/migration`:

### `V1__create_roles.sql`

Tạo bảng `roles`:

- `id` (PK, auto increment)
- `name` (unique)
- `description`
- `created_at`

Seed sẵn 4 role: `ADMIN`, `FARM_MANAGER`, `RETAILER`, `SHIPPER`.

### `V2__create_users.sql`

Tạo bảng `users`:

- `id` (CHAR(36), PK)
- `email` (unique)
- `password_hash`
- `full_name`
- `phone`
- `role_id` (FK -> `roles.id`)
- `is_active`
- `avatar_url`
- `created_at`, `updated_at`

Kèm index cho `role_id`, `is_active`, và seed tài khoản admin mặc định.

### `V3__create_refresh_tokens.sql`

Tạo bảng `refresh_tokens`:

- `id` (CHAR(36), PK)
- `user_id` (FK -> `users.id`)
- `token` (unique)
- `expiry_date`
- `is_revoked`
- `created_at`
- `device_info`

Quan hệ `ON DELETE CASCADE` theo user.

## Hướng dẫn chạy (Run Instructions)

## 1) Chuẩn bị môi trường

Service đọc cấu hình qua biến môi trường trong `application.yml`:

- `DB_HOST` (default `127.0.0.1`)
- `DB_PORT` (default `3306`)
- `IDENTITY_DB_NAME` (default `identity_db`)
- `DB_USERNAME` (default `bicap_user`)
- `DB_PASSWORD` (default `12123`)
- `jwt.secret`
- `jwt.access-token-expiry` (ms, default 15 phút)
- `jwt.refresh-token-expiry` (ms, default 7 ngày)

Port mặc định service: `8081`.

Ví dụ `.env` local tối thiểu:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
IDENTITY_DB_NAME=identity_db
DB_USERNAME=bicap_user
DB_PASSWORD=12123
JWT_SECRET=replace-with-strong-secret
```

> Với code hiện tại, cần đảm bảo DB MySQL đã tồn tại schema `identity_db` và user có quyền tương ứng.

## 2) Chạy độc lập bằng Maven

Tại thư mục `services/identity-service`:

```bash
mvn clean spring-boot:run
```

Hoặc build jar rồi chạy:

```bash
mvn clean package
java -jar target/identity-service-1.0.0.jar
```

## 3) Kiểm tra nhanh sau khi chạy

- Health check: `http://localhost:8081/actuator/health`
- Swagger UI: `http://localhost:8081/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8081/v3/api-docs`

## 4) Chạy bằng Docker (tuỳ chọn)

Service có `Dockerfile` multi-stage (Maven build + JRE runtime), expose cổng `8081`.
