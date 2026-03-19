-- ════════════════════════════════════════════════════════════
-- BICAP — Tạo 10 databases cho 10 services
-- Chạy tự động khi SQL Server container khởi động
-- ════════════════════════════════════════════════════════════

-- identity-service
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'identity_db')
    CREATE DATABASE identity_db;
GO

-- farm-service
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'farm_db')
    CREATE DATABASE farm_db;
GO

-- retailer-service
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'retailer_db')
    CREATE DATABASE retailer_db;
GO

-- shipping-service
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'shipping_db')
    CREATE DATABASE shipping_db;
GO

-- notification-service
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'notification_db')
    CREATE DATABASE notification_db;
GO

-- payment-service
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'payment_db')
    CREATE DATABASE payment_db;
GO

-- iot-service
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'iot_db')
    CREATE DATABASE iot_db;
GO

-- report-service
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'report_db')
    CREATE DATABASE report_db;
GO

-- guest-service
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'guest_db')
    CREATE DATABASE guest_db;
GO

-- blockchain-service (dùng SQLite local, nhưng tạo sẵn để nhất quán)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'blockchain_db')
    CREATE DATABASE blockchain_db;
GO

PRINT 'All 10 BICAP databases created successfully.';
GO