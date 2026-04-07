-- Liên kết tài kế với user (X-User-Id từ Gateway). Mặc định demo: user_id = id tài xế.
ALTER TABLE drivers ADD COLUMN user_id BIGINT;

UPDATE drivers SET user_id = id WHERE user_id IS NULL;

CREATE UNIQUE INDEX uk_drivers_user_id ON drivers (user_id);

-- Demo: gán chuyến đầu cho tài xế đầu để thử pickup trên app tài xế
UPDATE shipments s
SET driver_id = (SELECT d.id FROM drivers d ORDER BY d.id LIMIT 1),
    vehicle_id = (SELECT v.id FROM vehicles v ORDER BY v.id LIMIT 1),
    status = 'ASSIGNED'
WHERE s.driver_id IS NULL
  AND EXISTS (SELECT 1 FROM drivers)
  AND EXISTS (SELECT 1 FROM vehicles)
  AND s.id = (SELECT s2.id FROM shipments s2 ORDER BY s2.id LIMIT 1);
