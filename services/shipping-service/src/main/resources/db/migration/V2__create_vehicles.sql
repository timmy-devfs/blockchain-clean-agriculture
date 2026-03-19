-- Tạo bảng xe
CREATE TABLE vehicles (
    id             BIGSERIAL PRIMARY KEY,
    license_plate  VARCHAR(20) NOT NULL,
    type           VARCHAR(50) NOT NULL,   -- TRUCK, VAN, MOTORBIKE, REFRIGERATED_TRUCK
    capacity       DOUBLE PRECISION,
    is_active      BOOLEAN DEFAULT TRUE
);
