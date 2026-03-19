package com.bicap.shipping.entity;

import com.bicap.shipping.constant.ShipmentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// Bảng lưu lịch sử thay đổi trạng thái của chuyến hàng
// Ví dụ: CREATED → ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED
@Entity
@Table(name = "shipment_status_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipmentStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long shipmentId;    // Thuộc chuyến hàng nào

    @Enumerated(EnumType.STRING)
    private ShipmentStatus status;  // Trạng thái tại thời điểm này

    private LocalDateTime changedAt; // Thời điểm thay đổi

    private String changedBy;   // Ai thay đổi (userId hoặc system)

    private String note;        // Ghi chú thêm (ví dụ: lý do bị delay)

    // Lưu nhiều ảnh dạng JSON string: ["url1", "url2"]
    private String imageUrls;
}
