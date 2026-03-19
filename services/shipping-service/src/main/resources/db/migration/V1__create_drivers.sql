-- Tạo bảng tài xế
CREATE TABLE drivers (
    id             BIGSERIAL PRIMARY KEY,
    full_name      VARCHAR(255) NOT NULL,
    phone          VARCHAR(20),
    license_no     VARCHAR(50),
    license_class  VARCHAR(10),
    is_active      BOOLEAN DEFAULT TRUE
);
