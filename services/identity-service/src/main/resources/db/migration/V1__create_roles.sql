CREATE TABLE IF NOT EXISTS roles (
    id          INT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50)  NOT NULL,
    description VARCHAR(255) NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (name, description) VALUES
    ('ADMIN',        'Quan tri vien he thong'),
    ('FARM_MANAGER', 'Chu trang trai'),
    ('RETAILER',     'Nha ban le / Dai ly phan phoi'),
    ('SHIPPER',      'Tai xe giao hang');