-- Sau (Thiết kế chuẩn học thuật)
CREATE TABLE IF NOT EXISTS users (
    id            CHAR(36)     NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    phone         VARCHAR(20)  NULL,
    role_id       INT          NOT NULL DEFAULT 2, -- 2 tương ứng với FARM_MANAGER
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    avatar_url    VARCHAR(500) NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    INDEX ix_users_role   (role_id),
    INDEX ix_users_active (is_active),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id)
        REFERENCES roles(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lệnh INSERT cũng cần điều chỉnh tham số role_id
INSERT INTO users (id, email, password_hash, full_name, role_id, is_active)
VALUES (
    UUID(),
    'admin@bicap.io',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'BICAP Administrator',
    1, -- 1 tương ứng với ADMIN trong bảng roles
    1
);