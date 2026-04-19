-- ════════════════════════════════════════════════════════════
-- BICAP — Tạo 10 databases cho 10 services (MySQL 8.0)
-- File này chạy TỰ ĐỘNG khi MySQL container khởi động lần đầu
-- ════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS identity_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS notification_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS guest_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS blockchain_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant quyền cho bicap_user
GRANT ALL PRIVILEGES ON identity_db.*     TO 'bicap_user'@'%';
GRANT ALL PRIVILEGES ON notification_db.* TO 'bicap_user'@'%';
GRANT ALL PRIVILEGES ON guest_db.*        TO 'bicap_user'@'%';
GRANT ALL PRIVILEGES ON blockchain_db.*   TO 'bicap_user'@'%';

FLUSH PRIVILEGES;