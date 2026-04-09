package com.bicap.report.entity;

import com.bicap.report.constant.ReportStatus;
import com.bicap.report.constant.ReportType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long reporterUserId;

    private String reporterRole;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(50)")
    private ReportType type;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(columnDefinition = "TEXT")
    private String imageUrls;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(20)")
    private ReportStatus status;

    @Column(columnDefinition = "TEXT")
    private String adminNote;

    private LocalDateTime createdAt;

    private LocalDateTime resolvedAt;
}
