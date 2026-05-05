-- Tạo bảng báo cáo vận chuyển
-- Phải tạo sau shipments và drivers vì có foreign key
CREATE TABLE shipping_reports (
    id           BIGINT NOT NULL AUTO_INCREMENT,
    shipment_id  BIGINT NOT NULL,  -- Liên kết tới chuyến hàng
    driver_id    BIGINT NOT NULL,    -- Liên kết tới tài xế
    content      TEXT,
    image_urls   TEXT,    -- Lưu JSON array: ["url1","url2"]
    PRIMARY KEY (id),
    CONSTRAINT fk_reports_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id),
    CONSTRAINT fk_reports_driver FOREIGN KEY (driver_id) REFERENCES drivers(id)
);
