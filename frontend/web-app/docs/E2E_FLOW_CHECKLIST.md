# BICAP End-to-End Flow Checklist

## Chuẩn bị

- [ ] Docker stack chạy: `docker compose up -d --build`
- [ ] Kafka topics: `make make-topics` + `docker compose restart blockchain-service`
- [ ] Expo Go mở trên điện thoại, login `shipper1@bicap.io` (driver account linked seed)

## Luồng 1: Farm → Blockchain

- [ ] Farm tạo farm mới (web `/farm/dashboard` → modal)
- [ ] Admin duyệt farm (web `/admin/farms` → tab Pending → Duyệt)
- [ ] Farm tạo season (web `/farm/dashboard` → modal)
- [ ] Admin duyệt season (web `/admin/seasons` → Duyệt)
- [ ] Farm xem season → txHash xuất hiện sau 15-30s
- [ ] Link VeChain Explorer mở được

## Luồng 2: Retailer → Order → Payment

- [ ] Retailer vào `/retailer/marketplace` → thấy listing
- [ ] Đặt hàng → order tạo thành công
- [ ] Order status tự động → CONFIRMED
- [ ] Admin `/admin/orders` → thấy order

## Luồng 3: Shipping → Driver → FCM

- [ ] Shipping vào `/shipping/dashboard` → thấy order CONFIRMED
- [ ] Chọn tài xế + xe → bấm Tạo chuyến hàng
- [ ] Điện thoại nhận notification "Bạn có 1 đơn hàng mới" (dưới 30s)
- [ ] Tap notification → app mở đúng shipment
- [ ] App Driver tab Chuyến hàng → thấy shipment ASSIGNED
- [ ] Admin `/admin/shipments` → thấy shipment

## Kiểm tra bảo mật

- [ ] Không login → `/admin/dashboard` → redirect `/login`
- [ ] Login FARM → `/admin/dashboard` → redirect `/unauthorized`

## Ghi chú kết quả (điền khi test)

| Bước | Ngày | Kết quả / log |
|------|------|----------------|
| CURL notify `/api/notify/notifications/send` | | |
| Web tạo shipment + console `[FCM] Push sent` | | |
| Mobile tap notification → `/shipments/:id` | | |
