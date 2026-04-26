-- Tài khoản demo E2E (cùng bcrypt với admin@bicap.io trong V2 — mật khẩu: password)
INSERT INTO users (id, email, password_hash, full_name, role_id, is_active)
VALUES
    (UUID(), 'farm@bicap.io',
     '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
     'Demo Farm Manager', 2, 1),
    (UUID(), 'retailer@bicap.io',
     '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
     'Demo Retailer', 3, 1);
