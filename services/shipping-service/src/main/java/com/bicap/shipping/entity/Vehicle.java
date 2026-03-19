package com.bicap.shipping.entity;

import com.bicap.shipping.constant.VehicleType;
import jakarta.persistence.*;
import lombok.*;

// Bảng lưu thông tin xe
@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String licensePlate;  // Biển số xe

    @Enumerated(EnumType.STRING)
    private VehicleType type;     // Loại xe (TRUCK, VAN, MOTORBIKE, REFRIGERATED_TRUCK)

    private Double capacity;      // Tải trọng tối đa (kg)

    private Boolean isActive;     // Xe còn hoạt động không
}
