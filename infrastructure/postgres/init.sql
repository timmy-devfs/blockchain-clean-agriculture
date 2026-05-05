-- BICAP — PostgreSQL init scripts
-- Mục tiêu: tạo 2 DB shipping_db + report_db trong CÙNG 1 container

-- Lưu ý:
-- - PostgreSQL không hỗ trợ `CREATE DATABASE IF NOT EXISTS`.
-- - `CREATE DATABASE` không chạy được trong transaction block (DO $$ ... $$).
-- - Script trong `/docker-entrypoint-initdb.d/` chỉ chạy LẦN ĐẦU khi volume còn rỗng,
--   nên ở đây có thể tạo thẳng (không cần IF).

CREATE DATABASE report_db;


