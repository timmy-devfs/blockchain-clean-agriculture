package com.bicap.report.service;

import com.bicap.report.constant.ReportStatus;
import com.bicap.report.constant.ReportType;
import com.bicap.report.entity.Report;
import com.bicap.report.repository.ReportRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ReportService {
    private final ReportRepository reportRepository;
    private final ObjectMapper objectMapper;

    public ReportService(ReportRepository reportRepository, ObjectMapper objectMapper) {
        this.reportRepository = reportRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Report createReport(Long userId, String userRole, ReportType type, String content, List<String> imageUrls) {
        Report report = Report.builder()
                .reporterUserId(userId)
                .reporterRole(userRole)
                .type(type)
                .content(content)
                .imageUrls(toJson(imageUrls))
                .status(ReportStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
        return reportRepository.save(report);
    }

    // ── Chỉ trả báo cáo của user đang login ──
    public List<Report> listForUser(Long userId) {
        return reportRepository.findByReporterUserIdOrderByIdDesc(userId);
    }

    public List<Report> listForAdmin(ReportStatus status, String role) {
        if (status != null && role != null && !role.isBlank()) {
            return reportRepository.findByStatusAndReporterRoleOrderByIdDesc(status, role);
        }
        if (status != null) {
            return reportRepository.findByStatusOrderByIdDesc(status);
        }
        if (role != null && !role.isBlank()) {
            return reportRepository.findByReporterRoleOrderByIdDesc(role);
        }
        return reportRepository.findAll().stream().sorted((a, b) -> Long.compare(b.getId(), a.getId())).toList();
    }

    @Transactional
    public Optional<Report> resolve(Long id, String adminNote) {
        Optional<Report> reportOpt = reportRepository.findById(id);
        if (reportOpt.isEmpty()) {
            return Optional.empty();
        }
        Report report = reportOpt.get();
        report.setStatus(ReportStatus.RESOLVED);
        report.setAdminNote(adminNote);
        report.setResolvedAt(LocalDateTime.now());
        return Optional.of(reportRepository.save(report));
    }

    private String toJson(List<String> imageUrls) {
        if (imageUrls == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(imageUrls);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("imageUrls không hợp lệ");
        }
    }
}