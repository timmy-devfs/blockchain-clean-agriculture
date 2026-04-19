-- ════════════════════════════════════════════════════════════
-- V1: Bảng articles — bài viết giáo dục nông nghiệp
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS articles (
    id           CHAR(36)      NOT NULL,
    title        VARCHAR(500)  NOT NULL,
    content      TEXT          NOT NULL,
    category     VARCHAR(100)  NULL,
    image_url    VARCHAR(500)  NULL,
    author_id    CHAR(36)      NULL,
    published_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    view_count   INT           NOT NULL DEFAULT 0,
    is_published TINYINT(1)    NOT NULL DEFAULT 1,
    created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX ix_articles_category    (category),
    INDEX ix_articles_published   (is_published),
    INDEX ix_articles_published_at (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data: 2 bài viết mẫu
INSERT INTO articles (id, title, content, category, is_published) VALUES
    (UUID(), 'Giới thiệu BICAP — Hệ thống truy xuất nguồn gốc nông sản',
     'BICAP là nền tảng blockchain giúp người tiêu dùng xác minh nguồn gốc nông sản...', 
     'GENERAL', 1),
    (UUID(), 'Cách đọc QR Code truy xuất nguồn gốc',
     'Hướng dẫn quét mã QR để xem toàn bộ hành trình từ trang trại đến tay bạn...', 
     'GUIDE', 1);