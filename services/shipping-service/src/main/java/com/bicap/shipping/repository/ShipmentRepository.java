package com.bicap.shipping.repository;

import com.bicap.shipping.constant.ShipmentStatus;
import com.bicap.shipping.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findByDriverIdOrderByScheduledDateDesc(Long driverId);

    List<Shipment> findByStatusOrderByScheduledDateDesc(ShipmentStatus status);

    List<Shipment> findByScheduledDate(LocalDate scheduledDate);

    Optional<Shipment> findFirstByOrderIdOrderByIdDesc(Long orderId);

    List<Shipment> findByDriverIdIsNullAndStatusOrderByScheduledDateDesc(ShipmentStatus status);
}

