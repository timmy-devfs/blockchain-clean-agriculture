package com.bicap.shipping.repository;

import com.bicap.shipping.entity.ShippingReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ShippingReportRepository extends JpaRepository<ShippingReport, Long> {
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from ShippingReport r where r.shipmentId = :shipmentId")
    int deleteByShipmentId(@Param("shipmentId") Long shipmentId);
}
