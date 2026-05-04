-- Tên hiển thị + Mongo ObjectId (chuỗi) để tra farm/retailer; farmId/retailerId Long vẫn giữ tương thích.
ALTER TABLE shipments
    ADD COLUMN farm_external_id VARCHAR(64) NULL COMMENT 'Mongo farm id (hex 24)',
    ADD COLUMN retailer_external_id VARCHAR(64) NULL COMMENT 'Mongo retailer id',
    ADD COLUMN farm_display_name VARCHAR(255) NULL,
    ADD COLUMN retailer_display_name VARCHAR(255) NULL;
