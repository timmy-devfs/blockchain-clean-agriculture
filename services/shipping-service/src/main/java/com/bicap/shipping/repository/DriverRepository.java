package com.bicap.shipping.repository;

import com.bicap.shipping.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DriverRepository extends JpaRepository<Driver, Long> {
}

