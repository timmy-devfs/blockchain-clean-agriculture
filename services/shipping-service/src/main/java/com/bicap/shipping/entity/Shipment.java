package com.bicap.shipping.entity;

import com.bicap.shipping.constant.ShipmentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

// Bảng lưu thông tin mỗi chuyến giao hàng
@Entity
@Table(name = "shipments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;       // ID đơn hàng từ order-service

    private Long farmId;        // ID nông trại gửi hàng

    private Long retailerId;    // ID nhà bán lẻ nhận hàng

    private Long driverId;      // ID tài xế phụ trách

    private Long vehicleId;     // ID xe được dùng

    @Enumerated(EnumType.STRING)
    private ShipmentStatus status;  // Trạng thái hiện tại của chuyến hàng

    private String pickupAddress;   // Địa chỉ lấy hàng

    private String deliveryAddress; // Địa chỉ giao hàng

    private LocalDate scheduledDate; // Ngày dự kiến giao

    /** Mongo farm ObjectId (hex), khi có thì gọi farm-service lấy tên. */
    @Column(name = "farm_external_id")
    private String farmExternalId;

    @Column(name = "retailer_external_id")
    private String retailerExternalId;

    @Column(name = "farm_display_name")
    private String farmDisplayName;

    @Column(name = "retailer_display_name")
    private String retailerDisplayName;
}
