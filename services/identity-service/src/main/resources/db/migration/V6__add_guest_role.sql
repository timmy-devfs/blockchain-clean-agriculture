-- Role GUEST — khách xem công khai / email @bicap.io không nằm trong ROLE_MAP
INSERT IGNORE INTO roles (id, name, description)
VALUES (5, 'GUEST', 'Khach xem cong khai');
