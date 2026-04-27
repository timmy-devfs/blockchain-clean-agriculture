-- Tài khoản tài xế demo (JWT sub = id; khớp shipping.drivers.identity_user_id trong V6 shipping)
-- Mật khẩu: password (bcrypt giống admin@bicap.io trong V2)
INSERT INTO users (id, email, password_hash, full_name, phone, role_id, is_active)
SELECT
    'a0000001-0001-4001-8001-000000000001',
    'driver@bicap.io',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Tai xe demo BICAP',
    '0900000001',
    4,
    1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'driver@bicap.io');
