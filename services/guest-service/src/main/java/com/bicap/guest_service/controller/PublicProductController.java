package com.bicap.guest_service.controller;

import com.bicap.guest_service.dto.ApiResponse;
import com.bicap.guest_service.redis.PublicProductCache;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

/**
 * Public product APIs — proxy sang farm-service với Redis cache
 */
@RestController
@RequestMapping("/api/public/products")
@Slf4j
public class PublicProductController {

    private final WebClient           farmWebClient;
    private final PublicProductCache  cache;
    private final ObjectMapper        objectMapper;

    public PublicProductController(
            @Qualifier("farmWebClient") WebClient farmWebClient,
            PublicProductCache cache,
            ObjectMapper objectMapper) {
        this.farmWebClient = farmWebClient;
        this.cache         = cache;
        this.objectMapper  = objectMapper;
    }

    /**
     * GET /api/public/products
     * Proxy → farm-service /api/farm/marketplace/listings
     * Redis cache TTL 10 phút
     */
    @GetMapping
    public ApiResponse<Object> getProducts(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String province) {

        // Build cache key từ params
        String cacheKey = String.format("page=%d&size=%d&keyword=%s&province=%s",
                page, size, keyword, province);

        // Check Redis cache trước
        return cache.get(cacheKey)
                .map(cached -> {
                    try {
                        Object data = objectMapper.readValue(cached, Object.class);
                        return ApiResponse.success(data);
                    } catch (Exception e) {
                        return fetchFromFarmService(page, size, keyword, province, cacheKey);
                    }
                })
                .orElseGet(() -> fetchFromFarmService(page, size, keyword, province, cacheKey));
    }

    /**
     * GET /api/public/products/featured
     * Sản phẩm nổi bật được Admin pin
     */
    @GetMapping("/featured")
    public ApiResponse<Object> getFeaturedProducts() {
        String cacheKey = "featured";

        return cache.get(cacheKey).map(cached -> {
            try {
                return ApiResponse.success(objectMapper.readValue(cached, Object.class));
            } catch (Exception e) {
                return fetchFeatured(cacheKey);
            }
        }).orElseGet(() -> fetchFeatured(cacheKey));
    }

    /**
     * GET /api/public/products/{id}
     * Chi tiết sản phẩm
     */
    @GetMapping("/{id}")
    public ApiResponse<Object> getProductById(@PathVariable String id) {
        try {
            Object result = farmWebClient.get()
                    .uri("/api/farm/marketplace/listings/" + id)
                    .retrieve()
                    .bodyToMono(Object.class)
                    .block();
            return ApiResponse.success(result);
        } catch (Exception e) {
            log.warn("[GUEST] farm-service unavailable for product {}: {}", id, e.getMessage());
            return ApiResponse.error(503, "Product service temporarily unavailable");
        }
    }

    // ── Private helpers ───────────────────────────────────────

    private ApiResponse<Object> fetchFromFarmService(
            int page, int size, String keyword, String province, String cacheKey) {
        try {
            String uri = buildProductUri(page, size, keyword, province);
            Object result = farmWebClient.get()
                    .uri(uri)
                    .retrieve()
                    .bodyToMono(Object.class)
                    .block();

            // Lưu vào Redis cache
            cache.set(cacheKey, objectMapper.writeValueAsString(result));
            return ApiResponse.success(result);

        } catch (Exception e) {
            log.warn("[GUEST] farm-service unavailable: {}", e.getMessage());
            return ApiResponse.error(503, "Product service temporarily unavailable");
        }
    }

    private ApiResponse<Object> fetchFeatured(String cacheKey) {
        try {
            Object result = farmWebClient.get()
                    .uri("/api/farm/marketplace/listings?featured=true&size=6")
                    .retrieve()
                    .bodyToMono(Object.class)
                    .block();
            cache.set(cacheKey, objectMapper.writeValueAsString(result));
            return ApiResponse.success(result);
        } catch (Exception e) {
            log.warn("[GUEST] farm-service unavailable for featured: {}", e.getMessage());
            return ApiResponse.error(503, "Featured products temporarily unavailable");
        }
    }

    private String buildProductUri(int page, int size, String keyword, String province) {
        StringBuilder uri = new StringBuilder("/api/farm/marketplace/listings?")
                .append("page=").append(page)
                .append("&size=").append(size);
        if (keyword  != null && !keyword.isBlank())  uri.append("&keyword=").append(keyword);
        if (province != null && !province.isBlank()) uri.append("&province=").append(province);
        return uri.toString();
    }
}