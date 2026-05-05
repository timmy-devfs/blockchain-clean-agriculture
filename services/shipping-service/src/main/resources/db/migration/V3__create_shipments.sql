-- Tạo bảng chuyến hàng
-- Phải tạo sau bảng drivers và vehicles vì có foreign key
CREATE TABLE shipments (
    id                BIGINT NOT NULL AUTO_INCREMENT,
    order_id          BIGINT NOT NULL,
    farm_id           BIGINT NOT NULL,
    retailer_id       BIGINT NOT NULL,
    driver_id         BIGINT,     -- Liên kết tới bảng tài xế
    vehicle_id        BIGINT,    -- Liên kết tới bảng xe
    status            ENUM('created','assigned','picked_up','in_transit','delayed','delivered','cancelled') NOT NULL DEFAULT 'created',
    pickup_address    VARCHAR(500),
    delivery_address  VARCHAR(500),
    scheduled_date    DATE,
    PRIMARY KEY (id),
    CONSTRAINT fk_shipments_driver FOREIGN KEY (driver_id) REFERENCES drivers(id),
    CONSTRAINT fk_shipments_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);
