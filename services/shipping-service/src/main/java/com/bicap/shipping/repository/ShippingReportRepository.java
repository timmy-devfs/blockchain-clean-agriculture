package com.bicap.shipping.repository;

import com.bicap.shipping.entity.ShippingReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShippingReportRepository extends JpaRepository<ShippingReport, Long> {

    List<ShippingReport> findByShipmentIdOrderByIdDesc(Long shipmentId);

    List<ShippingReport> findByDriverIdOrderByIdDesc(Long driverId);
}