-- Tạo bảng chuyến hàng
-- Phải tạo sau bảng drivers và vehicles vì có foreign key
CREATE TABLE shipments (
    id                BIGSERIAL PRIMARY KEY,
    order_id          BIGINT NOT NULL,
    farm_id           BIGINT NOT NULL,
    retailer_id       BIGINT NOT NULL,
    driver_id         BIGINT REFERENCES drivers(id),     -- Liên kết tới bảng tài xế
    vehicle_id        BIGINT REFERENCES vehicles(id),    -- Liên kết tới bảng xe
    status            VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    pickup_address    VARCHAR(500),
    delivery_address  VARCHAR(500),
    scheduled_date    DATE
);
