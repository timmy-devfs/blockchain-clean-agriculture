package com.bicap.report.dto;

import com.bicap.report.constant.ReportType;

import java.util.List;

public record CreateReportRequest(
        ReportType type,
        String content,
        List<String> imageUrls
) {}
