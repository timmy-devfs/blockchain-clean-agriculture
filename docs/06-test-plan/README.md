# BIC-041 - [TEST] Integration Test (Postman + Newman)

## Deliverables
- `BIC-041-integration-3-flows.postman_collection.json`
- `BIC-041-local.postman_environment.json`
- `test-report.html` (generate by Newman command below)

## 3 Luong nghiep vu
- Luong 1: Farm tao vu mua -> export -> polling `txHash` toi da ~30s (`max_poll_attempts=6`, moi lan poll ~5s).
- Luong 2: Retailer end-to-end: search -> place order -> mock payment -> farm confirm -> shipping -> retailer confirm.
- Luong 3: IoT canh bao: post du lieu vuot nguong -> verify dashboard `activeAlerts/alertReadings24h > 0`.

## Chay bang Newman
```bash
newman run docs/06-test-plan/BIC-041-integration-3-flows.postman_collection.json \
  -e docs/06-test-plan/BIC-041-local.postman_environment.json \
  --delay-request 5000 \
  --reporters cli,html \
  --reporter-html-export docs/06-test-plan/test-report.html
```

## Neu chua co html reporter
```bash
npm i -g newman newman-reporter-html
```

## Acceptance mapping
- Luong 1 PASS: request `L1-05 Poll txHash (max 30s)` assert `txHash != null`.
- Luong 2 PASS: request `L2-08 Verify final order status` assert `DELIVERED`.
- Luong 3 PASS: request `L3-02 Verify dashboard active alerts` assert `> 0`.
- Newman PASS: exit code `0`, mo duoc file `test-report.html`.

## Luu y setup
- `retailer-service` va `payment-service` tren nhanh nay dung token gia lap: `Authorization: Bearer {{retailer_jwt_secret}}` (mac dinh `retailer-secret`).
- Voi `farm-service` va `iot-service`, can header `X-User-Id`/`X-User-Role` de mo phong user context.
- Cap nhat `farm_id`, `listing_id`, account login trong environment theo du lieu thuc te moi truong.
