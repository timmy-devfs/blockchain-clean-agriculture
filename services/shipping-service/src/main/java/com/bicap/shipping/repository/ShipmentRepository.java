package com.bicap.shipping.repository;

import com.bicap.shipping.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    List<Shipment> findByDriverIdOrderByIdDesc(Long driverId);

    Optional<Shipment> findByIdAndDriverId(Long id, Long driverId);
}

