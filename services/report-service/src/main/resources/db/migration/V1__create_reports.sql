CREATE TABLE reports (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    reporter_user_id BIGINT NOT NULL,
    reporter_role    VARCHAR(100) NOT NULL,
    type             VARCHAR(50) NOT NULL,
    content          TEXT NOT NULL,
    image_urls       TEXT,
    status           VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    admin_note       TEXT,
    created_at       DATETIME NOT NULL,
    resolved_at      DATETIME
);
