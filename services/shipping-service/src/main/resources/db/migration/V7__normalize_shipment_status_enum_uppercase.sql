-- Align DB enum values with Java enum names (UPPERCASE).
-- Old schema used lowercase enum literals, causing JPA enum parsing failures.

-- shipments.status
ALTER TABLE shipments
    MODIFY COLUMN status VARCHAR(32) NOT NULL;

UPDATE shipments
SET status = UPPER(status)
WHERE status IS NOT NULL;

ALTER TABLE shipments
    MODIFY COLUMN status ENUM('CREATED','ASSIGNED','PICKED_UP','IN_TRANSIT','DELAYED','DELIVERED','CANCELLED')
    NOT NULL DEFAULT 'CREATED';

-- shipment_status_history.status
ALTER TABLE shipment_status_history
    MODIFY COLUMN status VARCHAR(32) NOT NULL;

UPDATE shipment_status_history
SET status = UPPER(status)
WHERE status IS NOT NULL;

ALTER TABLE shipment_status_history
    MODIFY COLUMN status ENUM('CREATED','ASSIGNED','PICKED_UP','IN_TRANSIT','DELAYED','DELIVERED','CANCELLED')
    NOT NULL;
