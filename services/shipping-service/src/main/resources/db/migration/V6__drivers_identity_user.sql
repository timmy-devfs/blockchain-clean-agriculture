-- Liên kết drivers.id với identity users.id (JWT sub) — mobile / gateway dùng UUID, không parse Long
ALTER TABLE drivers
    ADD COLUMN identity_user_id CHAR(36) NULL AFTER id;

CREATE UNIQUE INDEX uq_drivers_identity_user_id ON drivers (identity_user_id);

UPDATE drivers
SET identity_user_id = 'a0000001-0001-4001-8001-000000000001'
WHERE identity_user_id IS NULL
ORDER BY id ASC
LIMIT 1;

INSERT INTO drivers (full_name, phone, license_no, license_class, is_active, identity_user_id)
SELECT
    'Tai xe demo BICAP',
    '0900000001',
    'LIC-DEMO',
    'B2',
    TRUE,
    'a0000001-0001-4001-8001-000000000001'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM drivers WHERE identity_user_id = 'a0000001-0001-4001-8001-000000000001');
