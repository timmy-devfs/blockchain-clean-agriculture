-- Tạo bảng lịch sử trạng thái
-- Phải tạo sau bảng shipments vì có foreign key
CREATE TABLE shipment_status_history (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    shipment_id  BIGINT NOT NULL,  -- Liên kết tới chuyến hàng
    status       VARCHAR(50) NOT NULL,
    changed_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by   VARCHAR(100),
    note         TEXT,
    image_urls   TEXT,   -- Lưu JSON array: ["url1","url2"]
    CONSTRAINT fk_status_history_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id)
);
