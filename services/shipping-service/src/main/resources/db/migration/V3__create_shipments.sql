-- Tạo bảng chuyến hàng
-- Phải tạo sau bảng drivers và vehicles vì có foreign key
CREATE TABLE shipments (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id          BIGINT NOT NULL,
    farm_id           BIGINT NOT NULL,
    retailer_id       BIGINT NOT NULL,
    driver_id         BIGINT,     -- Liên kết tới bảng tài xế
    vehicle_id        BIGINT,     -- Liên kết tới bảng xe
    status            VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    pickup_address    VARCHAR(500),
    delivery_address  VARCHAR(500),
    scheduled_date    DATE,
    CONSTRAINT fk_shipments_driver FOREIGN KEY (driver_id) REFERENCES drivers(id),
    CONSTRAINT fk_shipments_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);
