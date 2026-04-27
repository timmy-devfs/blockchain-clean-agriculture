package com.bicap.shipping.repository;

import com.bicap.shipping.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DriverRepository extends JpaRepository<Driver, Long> {

    Optional<Driver> findByIdentityUserId(String identityUserId);
}

