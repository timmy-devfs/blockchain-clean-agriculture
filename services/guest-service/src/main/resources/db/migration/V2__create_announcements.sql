-- ════════════════════════════════════════════════════════════
-- V2: Bảng announcements — thông báo hệ thống cho Guest
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS announcements (
    id         CHAR(36)     NOT NULL,
    title      VARCHAR(255) NOT NULL,
    content    TEXT         NOT NULL,
    start_at   DATETIME     NOT NULL,
    end_at     DATETIME     NOT NULL,
    is_active  TINYINT(1)   NOT NULL DEFAULT 1,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX ix_announcements_active  (is_active),
    INDEX ix_announcements_period  (start_at, end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed: 1 thông báo chào mừng
INSERT INTO announcements (id, title, content, start_at, end_at, is_active) VALUES
    (UUID(), 'Chào mừng đến với BICAP!',
     'Nền tảng truy xuất nguồn gốc nông sản tích hợp blockchain VeChainThor.',
     '2025-01-01 00:00:00', '2026-12-31 23:59:59', 1);