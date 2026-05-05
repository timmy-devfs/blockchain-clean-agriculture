package com.bicap.shipping.repository;

import com.bicap.shipping.entity.ShipmentStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ShipmentStatusHistoryRepository extends JpaRepository<ShipmentStatusHistory, Long> {
    List<ShipmentStatusHistory> findByShipmentIdOrderByChangedAtDesc(Long shipmentId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from ShipmentStatusHistory h where h.shipmentId = :shipmentId")
    int deleteByShipmentId(@Param("shipmentId") Long shipmentId);
}

