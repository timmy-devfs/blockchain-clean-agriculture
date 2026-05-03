package com.bicap.shipping.service;

import com.bicap.shipping.constant.VehicleType;
import com.bicap.shipping.dto.CreateDriverRequest;
import com.bicap.shipping.dto.CreateVehicleRequest;
import com.bicap.shipping.dto.DriverResponse;
import com.bicap.shipping.dto.VehicleResponse;
import com.bicap.shipping.entity.Driver;
import com.bicap.shipping.entity.Vehicle;
import com.bicap.shipping.repository.DriverRepository;
import com.bicap.shipping.repository.VehicleRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DriverFleetService {

    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;

    public DriverFleetService(DriverRepository driverRepository, VehicleRepository vehicleRepository) {
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public List<DriverResponse> listDrivers() {
        return driverRepository.findAll().stream().map(DriverFleetService::toDriverResponse).toList();
    }

    public List<VehicleResponse> listVehicles() {
        return vehicleRepository.findAll().stream().map(DriverFleetService::toVehicleResponse).toList();
    }

    @Transactional
    public DriverResponse createDriver(CreateDriverRequest req) {
        Driver d = driverRepository.save(Driver.builder()
                .fullName(req.fullName())
                .phone(req.phone())
                .licenseNo(req.licenseNumber())
                .licenseClass("B2")
                .isActive(true)
                .build());
        return toDriverResponse(d);
    }

    @Transactional
    public VehicleResponse createVehicle(CreateVehicleRequest req) {
        VehicleType type = parseVehicleType(req.type());
        Vehicle v = vehicleRepository.save(Vehicle.builder()
                .licensePlate(req.licensePlate())
                .type(type)
                .capacity(req.capacity())
                .isActive(true)
                .build());
        return toVehicleResponse(v);
    }

    private static VehicleType parseVehicleType(String raw) {
        if (raw == null || raw.isBlank()) {
            return VehicleType.VAN;
        }
        String u = raw.trim().toUpperCase();
        try {
            return switch (u) {
                case "MOTORBIKE", "XE_MAY" -> VehicleType.MOTORBIKE;
                case "VAN" -> VehicleType.VAN;
                case "TRUCK", "TAI" -> VehicleType.TRUCK;
                case "REFRIGERATED_TRUCK", "LANH" -> VehicleType.REFRIGERATED_TRUCK;
                default -> VehicleType.valueOf(u);
            };
        } catch (IllegalArgumentException e) {
            return VehicleType.VAN;
        }
    }

    private static DriverResponse toDriverResponse(Driver d) {
        return new DriverResponse(
                d.getId(),
                d.getFullName(),
                d.getPhone(),
                d.getLicenseNo(),
                d.getLicenseClass(),
                d.getIsActive()
        );
    }

    private static VehicleResponse toVehicleResponse(Vehicle v) {
        return new VehicleResponse(
                v.getId(),
                v.getLicensePlate(),
                v.getType(),
                v.getCapacity(),
                v.getIsActive()
        );
    }
}
