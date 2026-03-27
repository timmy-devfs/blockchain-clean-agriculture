-- ════════════════════════════════════════════════════════════
-- BICAP — Tạo 10 databases cho 10 services (MySQL 8.0)
-- File này chạy TỰ ĐỘNG khi MySQL container khởi động lần đầu
-- ════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS identity_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS farm_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS retailer_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS shipping_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS notification_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS payment_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS iot_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS report_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS guest_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS blockchain_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant quyền cho bicap_user
GRANT ALL PRIVILEGES ON identity_db.*     TO 'bicap_user'@'%';
GRANT ALL PRIVILEGES ON farm_db.*         TO 'bicap_user'@'%';
GRANT ALL PRIVILEGES ON retailer_db.*     TO 'bicap_user'@'%';
GRANT ALL PRIVILEGES ON shipping_db.*     TO 'bicap_user'@'%';
GRANT ALL PRIVILEGES ON notification_db.* TO 'bicap_user'@'%';
GRANT ALL PRIVILEGES ON payment_db.*      TO 'bicap_user'@'%';
GRANT ALL PRIVILEGES ON iot_db.*          TO 'bicap_user'@'%';
GRANT ALL PRIVILEGES ON report_db.*       TO 'bicap_user'@'%';
GRANT ALL PRIVILEGES ON guest_db.*        TO 'bicap_user'@'%';
GRANT ALL PRIVILEGES ON blockchain_db.*   TO 'bicap_user'@'%';

FLUSH PRIVILEGES;