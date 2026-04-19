# BICAP Contracts

Thư mục `contracts` là **hợp đồng giao tiếp chuẩn** cho toàn bộ hệ sinh thái BICAP (11 microservices: Java Spring Boot + NodeJS).  
Tất cả API và event payload phải được định nghĩa, review và version hóa tại đây trước khi bất kỳ service nào triển khai code runtime.

## 1) Mục đích (Purpose)

### Vì sao cần thư mục này?

- **Language-agnostic contracts**: định nghĩa giao tiếp độc lập ngôn ngữ, giúp Java, NodeJS, frontend dùng chung một chuẩn.
- **Single source of truth**: loại bỏ tình trạng mỗi team tự hiểu payload theo cách riêng.
- **Contract-first architecture**: API/Event được thiết kế trước, code implementation theo sau.
- **Giảm integration risk**: phát hiện breaking changes ngay ở tầng schema/spec thay vì phát sinh lỗi khi deploy.

### Giá trị kiến trúc

- Đồng bộ liên đội (Backend, Frontend, QA, DevOps, BA).
- Chuẩn hóa kiểm thử tích hợp và kiểm thử hồi quy.
- Tăng khả năng mở rộng khi bổ sung service mới mà không phá vỡ hợp đồng hiện hữu.

## 2) Cấu trúc (Directory Structure)

```text
contracts/
├── kafka-events/
│   ├── farm/
│   ├── retail/
│   ├── shipping/
│   ├── payment/
│   └── iot/
├── api-specs/
├── error-codes/
└── README.md
```

### `kafka-events/` - JSON Schema cho 9 topics

Định nghĩa cấu trúc event publish/consume giữa các service theo JSON Schema Draft-07.

| Topic | Schema file | Producer chính | Consumer chính |
|---|---|---|---|
| `bicap.season.created` | `farm/season-created.schema.json` | farm-service | blockchain-service |
| `bicap.season.updated` | `farm/season-updated.schema.json` | farm-service | blockchain-service |
| `bicap.season.exported` | `farm/season-exported.schema.json` | farm-service | blockchain-service |
| `bicap.order.confirmed` | `farm/order-confirmed.schema.json` | farm-service | shipping-service, notification-service |
| `bicap.order.placed` | `retail/order-placed.schema.json` | retailer-service | farm-service, notification-service |
| `bicap.order.delivered` | `retail/order-delivered.schema.json` | retailer-service | notification-service |
| `bicap.shipment.updated` | `shipping/shipment-updated.schema.json` | shipping-service | retailer-service, notification-service |
| `bicap.payment.success` | `payment/payment-success.schema.json` | payment-service | retailer-service |
| `bicap.iot.alert` | `iot/iot-alert.schema.json` | iot-service | notification-service |

Mọi schema đều tuân theo envelope chung:

- `eventId` (uuid)
- `eventType`
- `timestamp` (date-time)
- `version`
- `payload`

### `api-specs/` - OpenAPI 3.0 YAML

Định nghĩa contract REST API theo chuẩn OpenAPI 3.0.3 cho các service.

- `identity-service.openapi.yaml`
- `farm-service.openapi.yaml`
- `retailer-service.openapi.yaml`
- `shipping-service.openapi.yaml`
- `notification-service.openapi.yaml`
- `payment-service.openapi.yaml`
- `iot-service.openapi.yaml`
- `report-service.openapi.yaml`
- `guest-service.openapi.yaml`
- `blockchain-service.openapi.yaml`

Mục đích:

- Là nguồn sinh SDK/type cho frontend.
- Là chuẩn để implement controller ở Java/Node.
- Là tài liệu chuẩn cho QA viết test cases theo endpoint/response.

### `error-codes/` - Chuẩn mã lỗi 1xxx-9xxx

File `error-codes/error-codes.json` chuẩn hóa error domain toàn hệ thống:

- `1xxx`: Identity
- `2xxx`: Farm
- `3xxx`: Retailer
- `4xxx`: Shipping
- `5xxx`: Payment
- `9xxx`: System/Platform dùng chung

Mỗi mã lỗi bao gồm:

- `code`
- `httpStatus`
- `message` (EN)
- `vi` (Vietnamese message)

## 3) Luồng hoạt động (Workflow)

### A. Backend Java Spring Boot (Producer/Consumer Kafka)

1. Xác định topic trong `kafka-events/`.
2. Mapping DTO theo đúng JSON Schema (field name + type + required).
3. Producer publish đúng envelope (`eventId`, `eventType`, `timestamp`, `version`, `payload`).
4. Consumer validate payload trước khi xử lý business logic.
5. Nếu schema tăng version, cập nhật compatibility strategy (backward/forward) trước khi rollout.

Gợi ý thực thi:

- Dùng JSON Schema validator trong test/integration test.
- Chặn merge nếu payload thực tế lệch schema contract.

### B. Backend NodeJS (ví dụ blockchain-service)

1. Import schema từ `contracts/kafka-events/...`.
2. Validate bằng `ajv`/`ajv-formats`.
3. Reject event không hợp lệ và log rõ validation errors.
4. Chỉ xử lý downstream (ghi chain/DB) khi contract pass.

### C. Frontend/Web/Mobile

1. Đọc OpenAPI YAML trong `api-specs/`.
2. Sinh client/types tự động (ví dụ `openapi-typescript`, OpenAPI Generator).
3. Dùng generated types cho API layer thay vì tự định nghĩa interface thủ công.
4. Theo dõi thay đổi contract để cập nhật UI flow tương ứng.

### D. QA / Integration Testing

- Dùng OpenAPI để xây test theo endpoint + response code.
- Dùng Kafka schema để kiểm thử message contract ở consumer side.
- Dùng `error-codes.json` để assert business error chính xác theo domain.

## 4) Quy định đóng góp (Contribution Guide)

## Nguyên tắc bắt buộc

Mọi thay đổi giao tiếp liên-service phải theo quy trình **Contract First**:

1. **Sửa contract trong `contracts/` trước** (OpenAPI/JSON Schema/error code).
2. Tạo PR để review kiến trúc và compatibility.
3. Sau khi contract được chấp thuận mới implement code ở từng service.
4. Cập nhật test tương ứng (contract test/integration test).

### Khi thêm API mới

- Bắt buộc cập nhật đúng file `api-specs/<service>.openapi.yaml`.
- Định nghĩa rõ request/response, status codes, security requirement, error codes liên quan.
- Nếu API dùng lỗi mới, phải thêm mã vào `error-codes/error-codes.json` đúng dải domain.

### Khi sửa payload Kafka

- Bắt buộc cập nhật schema trong `kafka-events/...`.
- Đánh giá breaking vs non-breaking change:
  - Non-breaking: thêm field optional, giữ nguyên semantic cũ.
  - Breaking: đổi tên field, đổi kiểu dữ liệu, chuyển required/optional, đổi semantics.
- Với breaking change, phải:
  - tăng `version` event,
  - thông báo consumer owners,
  - chuẩn bị migration/rollout plan.

### Chính sách review

- Không merge code implementation nếu chưa có contract tương ứng.
- Không merge contract breaking change nếu chưa có kế hoạch tương thích rõ ràng.
- Contract phải rõ ràng, nhất quán naming, và có mô tả nghiệp vụ đủ để team khác implement độc lập.