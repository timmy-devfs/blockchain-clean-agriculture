# blockchain-service

> **BICAP** — Blockchain Integration in Clean Agricultural Production  
> NodeJS/TypeScript microservice tích hợp VeChainThor blockchain cho hệ thống truy xuất nguồn gốc nông sản sạch.

---

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Kiến trúc](#kiến-trúc)
3. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
4. [Cài đặt](#cài-đặt)
5. [Cấu hình môi trường](#cấu-hình-môi-trường)
6. [Smart Contracts](#smart-contracts)
7. [Chạy service](#chạy-service)
8. [API Endpoints](#api-endpoints)
9. [Kafka Events](#kafka-events)
10. [QR Code](#qr-code)
11. [Scripts hữu ích](#scripts-hữu-ích)
12. [Troubleshooting](#troubleshooting)

---

## Tổng quan

`blockchain-service` là microservice NodeJS duy nhất trong hệ thống BICAP chịu trách nhiệm:

- Lắng nghe **Kafka events** từ `farm-service`
- Ghi dữ liệu bất biến lên **VeChainThor testnet** qua smart contracts
- Tạo **QR Code PNG** cho vụ mùa đã xuất xưởng
- Cung cấp **REST API** để truy xuất nguồn gốc từ blockchain

```
farm-service ──Kafka──▶ blockchain-service ──▶ VeChainThor
                                          ──▶ QR Code PNG
                                          ◀── txHash callback
```

---

## Kiến trúc

```
blockchain-service/
├── src/
│   ├── config/
│   │   ├── VeChainConfig.ts        # Kết nối VeChainThor node
│   │   └── KafkaConfig.ts          # Consumer group + Producer
│   ├── kafka/
│   │   └── consumers/
│   │       ├── SeasonCreatedConsumer.ts   # → FarmTrace.createSeason()
│   │       ├── SeasonUpdatedConsumer.ts   # → FarmTrace.updateSeason()
│   │       └── SeasonExportedConsumer.ts  # → certifyExport() + QR
│   ├── services/
│   │   ├── SmartContractService.ts  # Giao tiếp với VeChainThor
│   │   ├── QRCodeService.ts         # Tạo QR Code PNG
│   │   └── TraceabilityService.ts   # Đọc dữ liệu từ blockchain
│   ├── controllers/
│   │   ├── ContractController.ts    # /api/chain/contracts/*
│   │   └── TraceController.ts       # /api/chain/trace/* + /qr/*
│   ├── utils/
│   │   ├── retryUtil.ts             # Retry với exponential backoff
│   │   └── hashUtil.ts              # SHA-256, explorer URL
│   └── index.ts                     # Express server port 8090
├── src/contracts/
│   ├── FarmTrace.sol                # Smart contract lịch sử vụ mùa
│   └── ProductCertification.sol     # Smart contract chứng nhận
├── hardhat.config.ts                # Cấu hình Hardhat (compile/test)
├── src/deploy.ts                    # Script deploy lên VeChainThor
├── src/FarmTrace.test.ts            # Unit test Hardhat
├── deployed-contracts.json          # Địa chỉ contract sau deploy
├── .env                             # Biến môi trường
├── docker-compose.yml               # Kafka + Zookeeper local
└── package.json
```

---

## Yêu cầu hệ thống

| Công cụ | Phiên bản | Ghi chú |
|---|---|---|
| Node.js | ≥ 18.x | LTS recommended |
| npm | ≥ 9.x | Đi kèm Node.js |
| Docker Desktop | ≥ 4.x | Chạy Kafka local |
| Sync2 Wallet | Bất kỳ | Tạo ví VeChain testnet |

---

## Cài đặt

### Bước 1 — Clone và cài dependencies

```bash
cd services/blockchain-service
npm install
```

### Bước 2 — Copy file môi trường

```bash
cp .env.example .env
```

### Bước 3 — Khởi động Kafka (Docker)

```bash
docker-compose up -d
# Kiểm tra Kafka đang chạy
docker ps | grep kafka
```

---

## Cấu hình môi trường

Chỉnh sửa file `.env`:

```dotenv
# ── Server ────────────────────────────────────────────────
PORT=8090
NODE_ENV=development

# ── VeChainThor ───────────────────────────────────────────
VECHAIN_TESTNET_URL=https://sync-testnet.vechain.org
VECHAIN_NETWORK=testnet

# Private key ví deployer — 64 ký tự hex, KHÔNG có tiền tố 0x
# Tạo ví + lấy VET miễn phí: https://faucet.vecha.in
VECHAIN_PRIVATE_KEY=your_64_char_private_key_here

# Địa chỉ contract (điền sau khi deploy)
FARM_TRACE_CONTRACT_ADDRESS=
PRODUCT_CERT_CONTRACT_ADDRESS=

# ── Kafka ─────────────────────────────────────────────────
KAFKA_ENABLED=true
KAFKA_CONSUME=true
KAFKA_BROKERS=localhost:9092

# ── Callback & QR ─────────────────────────────────────────
FARM_SERVICE_URL=http://localhost:8082
INTERNAL_API_KEY=bicap-internal-secret-key

# QR Base URL — dùng IP máy để điện thoại scan được
# Lấy IP: ipconfig (Windows) / ifconfig (Mac/Linux)
QR_BASE_URL=http://192.168.x.x:8090/api/chain/trace
```

### Lấy Private Key từ Sync2 Wallet (12 words)

```bash
# Chạy trong thư mục blockchain-service (cần ethers đã cài)
node -e "
const { ethers } = require('ethers');
const mnemonic = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';
const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, \"m/44'/818'/0'/0/0\");
console.log('Address    :', hdNode.address);
console.log('Private Key:', hdNode.privateKey.replace('0x', ''));
"
# Lưu ý: VeChain dùng coin type 818, khác Ethereum (60)
```

---

## Smart Contracts

### Compile

```bash
npm run compile
# Output: artifacts/src/contracts/FarmTrace.sol/FarmTrace.json
#         artifacts/src/contracts/ProductCertification.sol/ProductCertification.json
```

### Unit Test

```bash
npx hardhat test src/FarmTrace.test.ts
# Kết quả mong đợi:
#   FarmTrace
#     ✔ Should create season and get correct data
#   1 passing
```

### Deploy lên VeChainThor Testnet

> ⚠️ Cần VECHAIN_PRIVATE_KEY hợp lệ và ví có VTHO để trả gas.  
> Lấy VET + VTHO miễn phí: https://faucet.vecha.in

```bash
npm run deploy
```

Output mong đợi:
```
================================================
  BICAP — Deploy Smart Contracts to VeChainThor
  Node: https://sync-testnet.vechain.org
================================================

Deployer: 0xdd4DF278...

📦 Deploying FarmTrace...
✅ FarmTrace deployed!
   Address : 0xe56cc2c04d5d7435125e1650c3a918859c5145d3
   TxHash  : 0x0b46d800...
   Explorer: https://explore-testnet.vechain.org/transactions/0x0b46d800...

📦 Deploying ProductCertification...
✅ ProductCertification deployed!
   Address : 0x68d2a25babb4407098bd6747d53c0f6c65545912
   TxHash  : 0x1f9a32ac...

📝 Copy vào .env:
FARM_TRACE_CONTRACT_ADDRESS=0xe56cc2c04d5d7435125e1650c3a918859c5145d3
PRODUCT_CERT_CONTRACT_ADDRESS=0x68d2a25babb4407098bd6747d53c0f6c65545912
```

Sau đó copy 2 địa chỉ vào `.env` và restart service.

### Verify trên Explorer

```
https://explore-testnet.vechain.org/transactions/{txHash}
https://explore-testnet.vechain.org/accounts/{contractAddress}
```

---

## Chạy service

```bash
# Development (auto-reload)
npm run dev

# Production
npm run build
npm start
```

Log khởi động thành công:
```
[info] VeChain Testnet connected — block #24412571
[info] Smart contracts initialized → FarmTrace: 0xe56cc2c... | Cert: 0x68d2a25...
[info] Kafka consumer connected
[info] Kafka producer connected
[info] Subscribed to: bicap.season.created, bicap.season.updated, bicap.season.exported
[info] Consuming started...
[info] Blockchain service running on port 8090
```

---

## API Endpoints

### Health Check

```
GET /health
```
```json
{ "status": "ok", "service": "blockchain-service", "timestamp": "..." }
```

---

### Contract Status

```
GET /api/chain/contracts/status
```
```json
{
  "farmTrace": "0xe56cc2c04d5d7435125e1650c3a918859c5145d3",
  "productCertification": "0x68d2a25babb4407098bd6747d53c0f6c65545912",
  "network": "testnet",
  "status": "deployed"
}
```

---

### Deploy Contract *(ADMIN only)*

```
POST /api/chain/contracts/deploy
Header: X-User-Role: ADMIN
Body:   { "contractName": "FarmTrace" }
```

Không có header ADMIN → `403 Forbidden`

---

### Truy xuất nguồn gốc

```
GET /api/chain/trace/:seasonId
```
```json
{
  "code": 200,
  "data": {
    "seasonId": "S1774498387317",
    "verified": true,
    "farmInfo": {
      "farmId": "FARM01",
      "farmName": "Trang trại Hòa Bình",
      "province": "Tây Ninh"
    },
    "seasonInfo": {
      "cropType": "Lúa Jasmine",
      "startDate": "2024-01-01",
      "status": "ACTIVE"
    },
    "timeline": [
      {
        "status": "ACTIVE",
        "note": "Bón phân lần 1",
        "updatedAt": "2024-02-01T00:00:00.000Z",
        "timestamp": "2026-03-26T04:13:23.000Z"
      }
    ],
    "certification": { "verified": false }
  }
}
```

---

### QR Code PNG

```
GET /api/chain/qr/:seasonId
GET /api/chain/qr/:seasonId?format=base64
```

- `format=png` (mặc định): trả về binary PNG, `Content-Type: image/png`
- `format=base64`: trả về JSON với `base64Image`

---

## Kafka Events

Service lắng nghe 3 topics từ `farm-service`:

### `bicap.season.created` → `FarmTrace.createSeason()`

```json
{
  "eventId": "uuid",
  "eventType": "SEASON_CREATED",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0",
  "payload": {
    "seasonId": "uuid",
    "farmId": "uuid",
    "farmName": "Trang trại Hòa Bình",
    "cropType": "Lúa Jasmine",
    "startDate": "2024-01-01",
    "estimatedEndDate": "2024-04-30",
    "area": 5.5,
    "province": "Tây Ninh",
    "status": "PREPARING"
  }
}
```

**Kết quả:** Ghi `SeasonRecord` lên `FarmTrace.sol` → callback `txHash` về farm-service.

---

### `bicap.season.updated` → `FarmTrace.updateSeason()`

```json
{
  "eventId": "uuid",
  "eventType": "SEASON_UPDATED",
  "timestamp": "2024-02-01T00:00:00Z",
  "version": "1.0",
  "payload": {
    "seasonId": "uuid",
    "farmId": "uuid",
    "status": "ACTIVE",
    "note": "Bón phân lần 1, cây phát triển tốt",
    "imageUrls": [],
    "updatedAt": "2024-02-01T00:00:00Z",
    "updatedBy": "user-farm-manager-01"
  }
}
```

**Kết quả:** Thêm 1 entry vào `updateHistory[]` trên blockchain → callback `txHash`.

---

### `bicap.season.exported` → `certifyExport()` + QR Code

```json
{
  "eventId": "uuid",
  "eventType": "SEASON_EXPORTED",
  "timestamp": "2024-04-30T00:00:00Z",
  "version": "1.0",
  "payload": {
    "seasonId": "uuid",
    "farmId": "uuid",
    "cropType": "Lúa Jasmine",
    "exportedAt": "2024-04-30T08:00:00Z",
    "totalYield": 1500,
    "unit": "kg",
    "certifiedBy": "admin-user-01"
  }
}
```

**Kết quả:** Tạo QR Code PNG → ghi chứng nhận lên `ProductCertification.sol` → callback `qrCodeUrl` về farm-service.

---

### Retry Policy

Consumer tự động retry **3 lần** với exponential backoff khi VeChain timeout:
- Attempt 1 fail → chờ **1 giây**
- Attempt 2 fail → chờ **2 giây**  
- Attempt 3 fail → gửi vào Dead Letter Queue `bicap.dlq.blockchain`

---

## QR Code

QR Code được tạo bởi `QRCodeService`:

- **Format:** PNG, 512×512 pixels
- **Error Correction:** Level M (15% recovery)
- **Màu:** Dark `#1E3A5F`, Light `#FFFFFF`
- **URL encode:** `{QR_BASE_URL}/{seasonId}?farmId=...&txHash=...&v=1.0`
- **qrHash:** SHA-256 của QR URL string, ghi lên blockchain để verify

### Xem QR Code

```
http://localhost:8090/api/chain/qr/{seasonId}
```

Scan QR bằng điện thoại → URL `http://{IP_MAY}:8090/api/chain/trace/{seasonId}` → JSON dữ liệu blockchain.

---

## Scripts hữu ích

### Test endpoints (development only)

```bash
# Tạo season mới trên blockchain (seasonId tự tạo theo timestamp)
curl http://localhost:8090/test-season-created

# Update season (thay seasonId từ response trên)
curl "http://localhost:8090/test-season-updated?seasonId=S1774498387317"

# Export season + tạo QR Code
curl "http://localhost:8090/test-season-exported?seasonId=S1774498387317"

# Truy xuất kết quả
curl http://localhost:8090/api/chain/trace/S1774498387317

# Tải QR Code PNG
curl "http://localhost:8090/api/chain/qr/S1774498387317" --output qr.png
start qr.png  # Windows
```

### Kiểm tra số dư ví

```bash
curl https://sync-testnet.vechain.org/accounts/0xYOUR_ADDRESS
# energy > 0 → có VTHO để deploy/ghi blockchain
```

### Verify transaction trên Explorer

```
https://explore-testnet.vechain.org/transactions/{txHash}
```

