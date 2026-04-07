-- Seed tối thiểu để demo quản lý giao hàng (idempotent)
INSERT INTO drivers (full_name, phone, license_no, license_class, is_active)
SELECT 'Nguyen Van A', '0901111111', 'GPAA001', 'C', true
WHERE NOT EXISTS (SELECT 1 FROM drivers LIMIT 1);

INSERT INTO vehicles (license_plate, type, capacity, is_active)
SELECT '51H-12345', 'TRUCK', 5000, true
WHERE NOT EXISTS (SELECT 1 FROM vehicles LIMIT 1);

INSERT INTO shipments (order_id, farm_id, retailer_id, driver_id, vehicle_id, status, pickup_address, delivery_address, scheduled_date)
SELECT 1001, 10, 20, NULL, NULL, 'CREATED', 'Kho Farm A', 'Sieu thi B', CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM shipments LIMIT 1);

INSERT INTO shipment_status_history (shipment_id, status, changed_at, changed_by, note)
SELECT s.id, 'CREATED', NOW(), 'system', 'seed'
FROM shipments s
WHERE s.order_id = 1001
  AND NOT EXISTS (
    SELECT 1 FROM shipment_status_history h WHERE h.shipment_id = s.id AND h.note = 'seed'
  );
