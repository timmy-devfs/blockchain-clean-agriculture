# BICAP DEMO CHECKLIST

## Pre-demo (chạy trước 30 phút)

- [ ] docker compose up -d --build
- [ ] make make-topics
- [ ] Verify: curl http://localhost/nginx-health → {"status":"UP"}
- [ ] Verify: curl http://localhost:8080/actuator/health → status UP
- [ ] Register 4 tài khoản demo (xem HUONG_DAN_CHAY_TONG.txt section 4)
- [ ] Mở browser: http://localhost/login

## Demo flow Admin (DEV-01 demo)

- [ ] Login admin@bicap.io → redirect /admin/dashboard
- [ ] Dashboard: 4 StatCards hiển thị số liệu (không hardcode)
- [ ] /admin/farms → tab "Chờ duyệt" có farm list
- [ ] Approve 1 farm → confirm dialog → row chuyển tab "Đã duyệt"
- [ ] /admin/contracts → hiển thị contract address hoặc "Chưa deploy"
- [ ] /admin/reports → bảng báo cáo load được
- [ ] /admin/accounts → danh sách admin users

## Demo flow Farm (DEV-02)

- [ ] Login farm1@bicap.io → redirect /farm/dashboard
- [ ] Farm console load, không loop logout/login
- [ ] Tạo season mới thành công
- [ ] Xem danh sách seasons

## Demo flow Retailer (DEV-03)

- [ ] Login retail1@bicap.io → redirect /retailer/dashboard
- [ ] Retailer console load được marketplace
- [ ] Danh sách sản phẩm hiển thị (API hoặc fallback rõ ràng)

## Demo flow Shipping (DEV-04)

- [ ] Login shipper1@bicap.io → redirect /shipping/dashboard
- [ ] Shipment list load được
- [ ] Không còn gọi trực tiếp :8084

## Demo Public (không cần login)

- [ ] http://localhost/public → landing page hiển thị đủ section
- [ ] http://localhost/articles → bài viết load
- [ ] http://localhost/trace → trang trace có input QR code

## Kiểm tra bảo mật route

- [ ] Không login → truy cập /admin/dashboard → redirect /login
- [ ] Login FARM → truy cập /admin/dashboard → redirect /unauthorized
