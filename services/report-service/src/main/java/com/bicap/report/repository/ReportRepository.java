package com.bicap.report.repository;

import com.bicap.report.constant.ReportStatus;
import com.bicap.report.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    // ── Dùng cho GET /api/reports/my ──
    List<Report> findByReporterUserIdOrderByIdDesc(Long reporterUserId);

    List<Report> findByStatusOrderByIdDesc(ReportStatus status);

    List<Report> findByReporterRoleOrderByIdDesc(String reporterRole);

    List<Report> findByStatusAndReporterRoleOrderByIdDesc(ReportStatus status, String reporterRole);

    long countByStatus(ReportStatus status);
}