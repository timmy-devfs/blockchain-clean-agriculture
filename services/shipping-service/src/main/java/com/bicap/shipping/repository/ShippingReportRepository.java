package com.bicap.shipping.repository;

import com.bicap.shipping.entity.ShippingReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShippingReportRepository extends JpaRepository<ShippingReport, Long> {}
