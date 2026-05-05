package com.bicap.shipping.repository;

import com.bicap.shipping.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByIsActiveTrueOrderByIdAsc();
}

