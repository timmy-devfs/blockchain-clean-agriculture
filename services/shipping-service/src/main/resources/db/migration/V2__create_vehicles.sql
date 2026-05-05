-- Tạo bảng xe
CREATE TABLE vehicles (
    id             BIGINT NOT NULL AUTO_INCREMENT,
    license_plate  VARCHAR(20) NOT NULL,
    type           ENUM('truck','van','motorbike','refrigerated_truck') NOT NULL,
    capacity       DOUBLE PRECISION,
    is_active      BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id)
);
