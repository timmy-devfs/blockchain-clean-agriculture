-- Ensure enum literals are uppercase (follow-up migration).
-- V7 normalized shipment statuses; V8 added party display/external ids; this migration normalizes vehicles.type.

-- vehicles.type
ALTER TABLE vehicles
    MODIFY COLUMN type VARCHAR(64) NOT NULL;

UPDATE vehicles
SET type = UPPER(type)
WHERE type IS NOT NULL;

ALTER TABLE vehicles
    MODIFY COLUMN type ENUM('TRUCK','VAN','MOTORBIKE','REFRIGERATED_TRUCK')
    NOT NULL;

