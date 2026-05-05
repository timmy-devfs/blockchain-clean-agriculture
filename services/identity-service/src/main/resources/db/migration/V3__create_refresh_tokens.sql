CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          CHAR(36)     NOT NULL,
    user_id     CHAR(36)     NOT NULL,
    token       VARCHAR(500) NOT NULL,
    expiry_date DATETIME     NOT NULL,
    is_revoked  TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    device_info VARCHAR(255) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_refresh_token (token),
    INDEX ix_refresh_user_id (user_id),
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;