# 🌿 BICAP System
**Blockchain Integration in Clean Agricultural Production**

> Hệ thống truy xuất nguồn gốc nông sản tích hợp blockchain VeChainThor.  
> Môn: Xây dựng phần mềm hướng đối tượng | Học kỳ 2 — 2026–2027

## 🏗️ Kiến trúc tổng quan
```text
Client (Web/Mobile)
       │
       ▼
[API Gateway :8080]  ←── JWT Auth via identity-service
       │
       ├── identity-service    :8081  (Auth, User)
       ├── farm-service        :8082  (Farm, Season, IoT)
       ├── retailer-service    :8083  (Order, QR Scan)
       ├── shipping-service    :8084  (Shipment, Driver)
       ├── notification-service:8085  (Firebase FCM)
       ├── payment-service     :8086  (VNPay, MoMo)
       ├── iot-service         :8087  (Sensor, Alert)
       ├── report-service      :8088  (Reports)
       ├── guest-service       :8089  (Public APIs)
       └── blockchain-service  :8090  (VeChain NodeJS)

Event Bus: Apache Kafka
Cache: Redis
Database: SQL Server 2022
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend (10 services) | Java 17 + Spring Boot 3.x |
| Blockchain service | NodeJS 18 + TypeScript + VeChainThor |
| Frontend Web | NextJS 14 (App Router) |
| Mobile | React Native + Expo |
| Message Broker | Apache Kafka |
| Cache | Redis 7 |
| Database | SQL Server 2022 |
| Container | Docker + Docker Compose |
| Data Pipeline | Apache NiFi |


## 👥 Team

| ID | Role | Phụ trách |
|----|------|-----------|
| DEV-01 | Team Lead | api-gateway, identity-service, web-admin |
| DEV-02 | Backend Dev | farm-service, iot-service, web-farm |
| DEV-03 | Backend Dev | retailer-service, payment-service, web-retailer |
| DEV-04 | Backend Dev | shipping-service, report-service, web-shipping, web-public |
| DEV-05 | Backend Dev | blockchain-service, notification-service, guest-service, mobile-driver |

## 🚀 Quick Start

### Yêu cầu
- Docker Desktop (đang chạy)
- Git
- Java 17+ (cho development)
- NodeJS 18+ (cho blockchain-service và frontend)

### Clone & Start
git clone https://github.com/timmy-devfs/blockchain-clean-agriculture.git
cd blockchain-clean-agriculture

# Copy env template
copy .env.example .env
# Mở .env và điền các giá trị cần thiết

# Khởi động infrastructure
make up

# Kiểm tra trạng thái
make ps

### Verify
- Kafka: `localhost:9092`
- Redis: `localhost:6379`
- SQL Server: `localhost:1433`
- NiFi UI: `https://localhost:8443`

## 📁 Cấu trúc dự án
```text
bicap-system/
├── services/          # 11 microservices (Java + NodeJS)
├── contracts/         # Kafka schemas + OpenAPI specs
├── frontend/          # 5 web apps + 2 mobile apps
├── infrastructure/    # Docker, Kafka, Redis, Nginx, NiFi config
└── docs/              # Tài liệu học thuật
```

## 🌿 Branch Strategy

| Branch | Mục đích |
|--------|---------|
| `main` | Production-ready, protected — require PR + 1 review |
| `develop` | Integration branch — merge feature branches vào đây |
| `feature/BIC-xxx-ten-tinh-nang` | Mỗi task 1 branch riêng |

# Bắt đầu 1 task mới
git checkout develop
git pull origin develop
git checkout -b feature/BIC-001-init-monorepo
# ... làm việc ...
git push origin feature/BIC-001-init-monorepo
# Tạo PR vào develop trên GitHub
# ... cập nhật ...