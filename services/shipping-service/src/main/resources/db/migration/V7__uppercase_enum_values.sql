-- Đồng bộ ENUM values trong MySQL với Java enum (uppercase).
-- Tránh lỗi parse enum: No enum constant ...ShipmentStatus.created

ALTER TABLE shipments
  MODIFY COLUMN status ENUM('CREATED','ASSIGNED','PICKED_UP','IN_TRANSIT','DELAYED','DELIVERED','CANCELLED')
  NOT NULL DEFAULT 'CREATED';

ALTER TABLE shipment_status_history
  MODIFY COLUMN status ENUM('CREATED','ASSIGNED','PICKED_UP','IN_TRANSIT','DELAYED','DELIVERED','CANCELLED')
  NOT NULL;

ALTER TABLE vehicles
  MODIFY COLUMN type ENUM('TRUCK','VAN','MOTORBIKE','REFRIGERATED_TRUCK')
  NOT NULL;
