package com.bicap.shipping.service;

import com.bicap.shipping.constant.VehicleType;
import com.bicap.shipping.dto.CreateDriverRequest;
import com.bicap.shipping.dto.CreateVehicleRequest;
import com.bicap.shipping.dto.DriverResponse;
import com.bicap.shipping.dto.ProvisionDriverRequest;
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
    private final IdentityProvisionClient identityProvisionClient;

    public DriverFleetService(
            DriverRepository driverRepository,
            VehicleRepository vehicleRepository,
            IdentityProvisionClient identityProvisionClient) {
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
        this.identityProvisionClient = identityProvisionClient;
    }

    public List<DriverResponse> listDrivers() {
        return driverRepository.findAll().stream().map(DriverFleetService::toDriverResponse).toList();
    }

    public List<VehicleResponse> listVehicles() {
        return vehicleRepository.findAll().stream().map(DriverFleetService::toVehicleResponse).toList();
    }

    @Transactional
    public DriverResponse createDriver(CreateDriverRequest req) {
        String identityUserId = req.identityUserId();
        if (identityUserId == null || identityUserId.isBlank()) {
            identityUserId = identityProvisionClient.registerShipper(
                    req.fullName(),
                    req.phone()
            );
        }

        if (identityUserId != null && !identityUserId.isBlank()) {
            Driver linked = driverRepository.findByIdentityUserId(identityUserId.trim()).orElse(null);
            if (linked != null) {
                // Identity service có thể callback nội bộ tạo driver trước khi request này save.
                // Cập nhật các trường nhập từ dashboard thay vì insert trùng identity_user_id.
                if (req.fullName() != null && !req.fullName().isBlank()) {
                    linked.setFullName(req.fullName().trim());
                }
                if (req.phone() != null && !req.phone().isBlank()) {
                    linked.setPhone(req.phone().trim());
                }
                if (req.licenseNumber() != null && !req.licenseNumber().isBlank()) {
                    linked.setLicenseNo(req.licenseNumber().trim());
                }
                if (linked.getIsActive() == null || !linked.getIsActive()) {
                    linked.setIsActive(true);
                }
                Driver saved = driverRepository.save(linked);
                return toDriverResponse(saved);
            }
        }

        var builder = Driver.builder()
                .fullName(req.fullName())
                .phone(req.phone())
                .licenseNo(req.licenseNumber())
                .licenseClass("B2")
                .isActive(true);
        if (identityUserId != null && !identityUserId.isBlank()) {
            builder.identityUserId(identityUserId.trim());
        }
        Driver d = driverRepository.save(builder.build());
        return toDriverResponse(d);
    }

    @Transactional
    public DriverResponse upsertDriverFromIdentity(ProvisionDriverRequest req) {
        Driver existing = driverRepository.findByIdentityUserId(req.identityUserId()).orElse(null);
        if (existing != null) {
            if (req.fullName() != null && !req.fullName().isBlank()) {
                existing.setFullName(req.fullName().trim());
            }
            if (req.phone() != null) {
                existing.setPhone(req.phone().trim());
            }
            if (existing.getIsActive() == null || !existing.getIsActive()) {
                existing.setIsActive(true);
            }
            Driver saved = driverRepository.save(existing);
            return toDriverResponse(saved);
        }

        Driver created = driverRepository.save(Driver.builder()
                .identityUserId(req.identityUserId().trim())
                .fullName(req.fullName())
                .phone(req.phone())
                .licenseNo("PENDING")
                .licenseClass("B2")
                .isActive(true)
                .build());
        return toDriverResponse(created);
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
                d.getIsActive(),
                d.getIdentityUserId()
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
