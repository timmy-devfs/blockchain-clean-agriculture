# DRIVER NOTIFICATION TEST — BICAP

**Ngày test:** ___________
**Người test:** ___________

## Bước 0 — Chuẩn bị môi trường

- [ ] `docker compose up -d --build` thành công
- [ ] `make make-topics` đã chạy
- [ ] `docker compose logs notification-service` — không có startup error
- [ ] `docker compose logs shipping-service` — không có startup error

## Bước 1 — Đăng nhập web Shipping

URL: http://localhost/shipping/dashboard
Account: shipper1@bicap.io / 123456

- [ ] Web load được, không bị redirect sai
- [ ] Section "Phân công chuyến hàng" hiển thị với 2 dropdown

## Bước 2 — Tạo Driver demo (QUAN TRỌNG — làm trước khi test FCM)

Bấm nút **«Tạo tài xế & xe demo»** trong dashboard

- [ ] Alert thành công xuất hiện
- [ ] Dropdown Tài xế có ít nhất 1 item với dấu ✓ (có identityUserId)
- [ ] Driver trong dropdown không có ⚠️ (tức là có identityUserId)

Verify bằng curl:
```bash
curl.exe http://localhost/api/shipping/drivers \
  -H "Authorization: Bearer "
# → driver có field identityUserId khác rỗng/null
```

## Bước 3 — Đăng nhập app Driver + đăng ký FCM token

- [ ] Mở Expo Go trên điện thoại
- [ ] Login shipper1@bicap.io / 123456
- [ ] Console Expo log: `[PUSH] Token registered for user: <UUID>`
- [ ] Ghi lại token: ___________

Verify token đã lưu server:
```bash
curl.exe "http://localhost/api/notify/tokens/" \
  -H "Authorization: Bearer "
# → có token, không rỗng
```

## Bước 4 — Test gửi FCM thủ công (smoke test)

```bash
curl.exe -X POST "http://localhost/api/notify/notifications/send" \
  -H "Authorization: Bearer " \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"\",\"title\":\"Test Manual\",\"body\":\"Hello Driver\",\"data\":{\"shipmentId\":\"test-999\",\"type\":\"NEW_SHIPMENT\",\"screen\":\"shipment_detail\"}}"
```

- [ ] Response: HTTP 200
- [ ] Điện thoại nhận notification trong vòng 10 giây: YES / NO
- [ ] Thời gian nhận: ___ giây

## Bước 5 — Tạo Shipment từ web → nhận FCM

Cần có ORDER_ID với status CONFIRMED (từ Retailer tạo order)

Trên web Shipping:
1. [ ] Chọn tài xế trong dropdown (có dấu ✓)
2. [ ] Chọn phương tiện
3. [ ] Bấm "Tạo chuyến hàng" cho order đang chờ
4. [ ] Alert thành công với SHIPMENT_ID

Console browser log:
- [ ] `[SHIPMENT] Created: <ID>` — YES / NO
- [ ] `[FCM] Push sent to driver userId: <UUID>` — YES / NO

Điện thoại:
- [ ] Nhận notification "Đơn hàng mới" trong 10-30 giây: YES / NO
- [ ] Tap notification → app mở màn hình shipment detail: YES / NO
- [ ] shipmentId trong màn hình khớp với SHIPMENT_ID trên web: YES / NO

## Bước 6 — Verify shipment trong app

App Driver → tab Shipments:
- [ ] Shipment mới xuất hiện trong danh sách
- [ ] Status hiển thị "Được phân công" / "ASSIGNED"
- [ ] Tap vào card → màn hình detail đúng

## Kết quả tổng

| Luồng | Kết quả |
|-------|---------|
| Web Shipping tạo Shipment | PASS / FAIL |
| FCM gửi đến đúng driver | PASS / FAIL |
| App nhận notification | PASS / FAIL |
| Tap → navigate đúng | PASS / FAIL |
| Shipment list trong app | PASS / FAIL |

## Lỗi gặp phải (nếu có)

___________

## Ghi chú URL quan trọng

- Notification: POST `/api/notify/notifications/send` (KHÔNG phải /api/notification/...)
- Token register: POST `/api/notify/tokens`
- Driver shipments: GET `/api/shipping/driver/shipments`
- Driver list: GET `/api/shipping/drivers`
