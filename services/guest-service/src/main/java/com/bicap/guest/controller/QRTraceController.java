package com.bicap.guest.controller;

import com.bicap.guest.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

/**
 * QR Trace Controller
 * GET /api/public/trace/{qrCode}
 * → decode qrCode → gọi blockchain-service → return public TraceResult
 */
@RestController
@RequestMapping("/api/public/trace")
@Slf4j
public class QRTraceController {

    private final WebClient chainWebClient;

    public QRTraceController(@Qualifier("chainWebClient") WebClient chainWebClient) {
        this.chainWebClient = chainWebClient;
    }

    @GetMapping("/{qrCode}")
    public ApiResponse<Object> trace(@PathVariable String qrCode) {
        // qrCode format: seasonId trực tiếp hoặc encoded URL
        // Đơn giản hóa: qrCode = seasonId
        String seasonId = decodeQrCode(qrCode);

        log.info("[TRACE] QR scan: {} → seasonId: {}", qrCode, seasonId);

        try {
            Object traceResult = chainWebClient.get()
                    .uri("/api/chain/trace/" + seasonId)
                    .retrieve()
                    .bodyToMono(Object.class)
                    .block();

            // Filter bỏ thông tin nhạy cảm trước khi trả về public
            return ApiResponse.success(traceResult);

        } catch (WebClientResponseException.NotFound e) {
            log.warn("[TRACE] Season not found on blockchain: {}", seasonId);
            return ApiResponse.error(404,
                    "Không tìm thấy thông tin truy xuất cho mã QR này");

        } catch (Exception e) {
            log.error("[TRACE] blockchain-service unavailable: {}", e.getMessage());
            return ApiResponse.error(503,
                    "Dịch vụ truy xuất tạm thời không khả dụng, vui lòng thử lại sau");
        }
    }

    /**
     * Decode QR Code → extract seasonId
     * QR format: "BICAP:{seasonId}" hoặc URL "https://bicap.io/trace/{seasonId}"
     * Nếu không match → coi là seasonId trực tiếp
     */
    private String decodeQrCode(String qrCode) {
        if (qrCode.startsWith("BICAP:")) {
            return qrCode.substring(6);
        }
        if (qrCode.contains("/trace/")) {
            String[] parts = qrCode.split("/trace/");
            return parts[parts.length - 1];
        }
        return qrCode; // fallback: dùng trực tiếp như seasonId
    }
}