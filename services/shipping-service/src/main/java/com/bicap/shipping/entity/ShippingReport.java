package com.bicap.shipping.entity;

import jakarta.persistence.*;
import lombok.*;

// Bảng lưu báo cáo của tài xế sau mỗi chuyến hàng
@Entity
@Table(name = "shipping_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShippingReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long shipmentId;    // Thuộc chuyến hàng nào

    private Long driverId;      // Tài xế viết báo cáo này

    private String content;     // Nội dung báo cáo

    // Ảnh chụp khi giao hàng, lưu dạng JSON: ["url1", "url2"]
    private String imageUrls;
}
