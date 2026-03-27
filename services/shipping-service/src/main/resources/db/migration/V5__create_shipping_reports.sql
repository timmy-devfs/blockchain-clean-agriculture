-- Tạo bảng báo cáo vận chuyển
-- Phải tạo sau shipments và drivers vì có foreign key
CREATE TABLE shipping_reports (
    id           BIGSERIAL PRIMARY KEY,
    shipment_id  BIGINT NOT NULL REFERENCES shipments(id),  -- Liên kết tới chuyến hàng
    driver_id    BIGINT NOT NULL REFERENCES drivers(id),    -- Liên kết tới tài xế
    content      TEXT,
    image_urls   TEXT    -- Lưu JSON array: ["url1","url2"]
);
