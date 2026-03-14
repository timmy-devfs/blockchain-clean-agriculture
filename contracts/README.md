# 📋 BICAP Contracts

**Single source of truth** cho toàn bộ hệ thống BICAP.
Mọi service đọc schema tại đây để đảm bảo đồng nhất payload.

---

## 📁 Cấu trúc
```
contracts/
├── kafka-events/     # JSON Schema cho 9 Kafka topics
├── api-specs/        # OpenAPI 3.0 YAML cho 10 services  
├── error-codes/      # Mã lỗi chuẩn hóa toàn hệ thống
└── README.md
```

---

## 📨 Kafka Events — 9 Topics

| File | Topic | Producer | Consumer(s) |
|------|-------|----------|-------------|
| `farm/season-created` | `bicap.season.created` | farm-service | blockchain-service |
| `farm/season-updated` | `bicap.season.updated` | farm-service | blockchain-service |
| `farm/season-exported` | `bicap.season.exported` | farm-service | blockchain-service |
| `farm/order-confirmed` | `bicap.order.confirmed` | farm-service | shipping-service, notification-service |
| `retail/order-placed` | `bicap.order.placed` | retailer-service | farm-service, notification-service |
| `retail/order-delivered` | `bicap.order.delivered` | retailer-service | notification-service |
| `shipping/shipment-updated` | `bicap.shipment.updated` | shipping-service | retailer-service, notification-service |
| `payment/payment-success` | `bicap.payment.success` | payment-service | retailer-service |
| `iot/iot-alert` | `bicap.iot.alert` | iot-service | notification-service |

---

## ✅ Validate Event Payload (blockchain-service — NodeJS)

Cài `ajv`:
```bash
cd services/blockchain-service
npm install ajv ajv-formats
```

Dùng trong code:
```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import seasonCreatedSchema from '../../../contracts/kafka-events/farm/season-created.schema.json';

const ajv = new Ajv();
addFormats(ajv);

const validate = ajv.compile(seasonCreatedSchema);

export function validateSeasonCreatedEvent(data: unknown): boolean {
  const valid = validate(data);
  if (!valid) {
    console.error('SeasonCreatedEvent validation errors:', validate.errors);
    throw new Error('Invalid event payload');
  }
  return true;
}
```

---

## 📖 OpenAPI Specs — 10 Services

| File | Service | Port |
|------|---------|------|
| `identity-service.openapi.yaml` | Auth + User | 8081 |
| `farm-service.openapi.yaml` | Farm + Season + Marketplace | 8082 |
| `retailer-service.openapi.yaml` | Order + QR | 8083 |
| `shipping-service.openapi.yaml` | Shipment + Driver | 8084 |
| `notification-service.openapi.yaml` | FCM Push | 8085 |
| `payment-service.openapi.yaml` | VNPay + MoMo | 8086 |
| `iot-service.openapi.yaml` | Sensor + Alert | 8087 |
| `report-service.openapi.yaml` | Reports | 8088 |
| `guest-service.openapi.yaml` | Public APIs | 8089 |
| `blockchain-service.openapi.yaml` | VeChain + QR | 8090 |

Xem Swagger UI trực tiếp (sau khi service chạy):
```
http://localhost:{PORT}/swagger-ui/index.html
```

---

## ❌ Error Codes

Mọi service đều trả lỗi theo chuẩn:
```json
{
  "code": 1001,
  "message": "Email already exists",
  "data": null
}
```

| Domain | Range | Service |
|--------|-------|---------|
| Identity | 1xxx | identity-service |
| Farm | 2xxx | farm-service |
| Retail | 3xxx | retailer-service |
| Shipping | 4xxx | shipping-service |
| Payment | 5xxx | payment-service |
| System | 9xxx | Tất cả services |