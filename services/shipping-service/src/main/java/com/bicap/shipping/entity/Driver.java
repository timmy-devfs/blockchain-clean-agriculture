package com.bicap.shipping.entity;

import jakarta.persistence.*;
import lombok.*;

// Bảng lưu thông tin tài xế
@Entity
@Table(name = "drivers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;    // Họ tên tài xế

    private String phone;       // Số điện thoại

    private String licenseNo;   // Số bằng lái

    private String licenseClass; // Hạng bằng lái (B1, B2, C...)

    private Boolean isActive;   // Còn làm việc không (true/false)
}
