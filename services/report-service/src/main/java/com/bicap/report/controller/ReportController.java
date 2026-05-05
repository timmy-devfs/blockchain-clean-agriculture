package com.bicap.report.controller;

import com.bicap.report.common.ApiResponse;
import com.bicap.report.common.ErrorCode;
import com.bicap.report.constant.ReportStatus;
import com.bicap.report.dto.CreateReportRequest;
import com.bicap.report.dto.ResolveReportRequest;
import com.bicap.report.entity.Report;
import com.bicap.report.service.ReportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@RequestBody CreateReportRequest req, Authentication auth) {
        Long userId = getUserId(auth);
        if (userId == null || req == null || req.type() == null || isBlank(req.content())) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ErrorCode.BAD_REQUEST));
        }
        String role = getRole(auth);
        Report created = reportService.createReport(userId, role, req.type(), req.content().trim(), req.imageUrls());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    // ── GET /api/reports/my — chỉ trả báo cáo của user đang login ──
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<?>> listMy(Authentication auth) {
        Long userId = getUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(ErrorCode.UNAUTHORIZED));
        }
        List<Report> list = reportService.listForUser(userId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<?>> listAdmin(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) String role,
            Authentication auth
    ) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ErrorCode.FORBIDDEN));
        }
        List<Report> list = reportService.listForAdmin(status, role);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/admin/dashboard")
    public ResponseEntity<ApiResponse<?>> adminDashboard(Authentication auth) {
        // Demo mode: dashboard should stay readable for any authenticated gateway user.
        // Role checks remain on mutating admin endpoints (resolve, etc.).
        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(ErrorCode.UNAUTHORIZED));
        }
        return ResponseEntity.ok(ApiResponse.success(reportService.buildAdminDashboard()));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<?>> resolve(
            @PathVariable Long id,
            @RequestBody(required = false) ResolveReportRequest req,
            Authentication auth
    ) {
        if (!isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ErrorCode.FORBIDDEN));
        }
        String note = req != null ? req.adminNote() : null;
        Optional<Report> resolved = reportService.resolve(id, note);
        return resolved.<ResponseEntity<ApiResponse<?>>>map(report -> ResponseEntity.ok(ApiResponse.success(report)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ErrorCode.REPORT_NOT_FOUND)));
    }

    private static Long getUserId(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return null;
        }
        try {
            return Long.parseLong(auth.getPrincipal().toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String getRole(Authentication auth) {
        if (auth == null || auth.getAuthorities() == null || auth.getAuthorities().isEmpty()) {
            return "UNKNOWN";
        }
        String authority = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).findFirst().orElse("ROLE_UNKNOWN");
        return authority.startsWith("ROLE_") ? authority.substring("ROLE_".length()) : authority;
    }

    private static boolean isAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}