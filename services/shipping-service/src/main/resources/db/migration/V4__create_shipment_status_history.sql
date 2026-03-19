-- Tạo bảng lịch sử trạng thái
-- Phải tạo sau bảng shipments vì có foreign key
CREATE TABLE shipment_status_history (
    id           BIGSERIAL PRIMARY KEY,
    shipment_id  BIGINT NOT NULL REFERENCES shipments(id),  -- Liên kết tới chuyến hàng
    status       VARCHAR(50) NOT NULL,
    changed_at   TIMESTAMP DEFAULT NOW(),
    changed_by   VARCHAR(100),
    note         TEXT,
    image_urls   TEXT    -- Lưu JSON array: ["url1","url2"]
);
