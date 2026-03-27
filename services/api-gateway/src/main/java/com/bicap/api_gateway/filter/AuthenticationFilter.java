package com.bicap.api_gateway.filter;

import com.bicap.api_gateway.dto.IntrospectResponse;
import com.bicap.api_gateway.util.RouteValidator;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Map;

/**
 * BIC-011: JWT validation qua identity-service /introspect
 * BIC-012: Redis cache JWT introspect result (TTL 5 phút)
 *
 * Flow:
 * 1. Whitelist path → forward thẳng
 * 2. Không có Bearer token → 401
 * 3. Check Redis cache (SHA256 token) → hit → forward với headers
 * 4. Cache miss → gọi identity-service introspect
 * 5. Valid → cache + forward với X-User-* headers
 * 6. Invalid → 401
 */
@Component
@Slf4j
public class AuthenticationFilter implements GlobalFilter, Ordered {

    private final RouteValidator               routeValidator;
    private final WebClient                    webClient;
    private final ReactiveStringRedisTemplate  redisTemplate;
    private final ObjectMapper                 objectMapper;

    @Value("${identity.service.url}")
    private String identityServiceUrl;

    @Value("${identity.service.introspect-path}")
    private String introspectPath;

    @Value("${gateway.jwt-cache-ttl-seconds:300}")
    private long jwtCacheTtlSeconds;

    public AuthenticationFilter(
            RouteValidator routeValidator,
            WebClient.Builder webClientBuilder,
            ReactiveStringRedisTemplate redisTemplate,
            ObjectMapper objectMapper) {
        this.routeValidator = routeValidator;
        this.webClient      = webClientBuilder.build();
        this.redisTemplate  = redisTemplate;
        this.objectMapper   = objectMapper;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // ── 1. Whitelist — forward thẳng không cần token ────────
        if (routeValidator.isWhitelisted(path)) {
            log.debug("[AUTH] Whitelisted: {}", path);
            return chain.filter(exchange);
        }

        // ── 2. Lấy Bearer token ───────────────────────────────────
        String authHeader = exchange.getRequest().getHeaders()
                .getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("[AUTH] Missing token: {}", path);
            return rejectUnauthorized(exchange, "Authorization token is required");
        }

        String token = authHeader.substring(7);
        String cacheKey = buildCacheKey(token);

        // ── 3. Check Redis cache (BIC-012) ────────────────────────
        return redisTemplate.opsForValue().get(cacheKey)
                .flatMap(cachedJson -> {
                    // Cache HIT — không cần gọi identity-service
                    log.debug("[AUTH] Cache HIT: {}", cacheKey.substring(0, 12) + "...");
                    try {
                        IntrospectResponse cached = objectMapper
                                .readValue(cachedJson, IntrospectResponse.class);
                        if (cached.isValid()) {
                            return forwardWithUserHeaders(exchange, chain, cached);
                        }
                        return rejectUnauthorized(exchange, "Token is invalid or expired");
                    } catch (Exception e) {
                        log.error("[AUTH] Cache parse error: {}", e.getMessage());
                        return callIntrospectAndCache(exchange, chain, token, cacheKey);
                    }
                })
                // Cache MISS — gọi identity-service
                .switchIfEmpty(callIntrospectAndCache(exchange, chain, token, cacheKey));
    }

    // ── Gọi identity-service /introspect ──────────────────────────
    private Mono<Void> callIntrospectAndCache(
            ServerWebExchange exchange,
            GatewayFilterChain chain,
            String token,
            String cacheKey) {

        log.debug("[AUTH] Cache MISS — calling identity-service introspect");

        return webClient.post()
                .uri(identityServiceUrl + introspectPath)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("token", token))
                .retrieve()
                .bodyToMono(IntrospectResponseWrapper.class)
                .flatMap(wrapper -> {
                    IntrospectResponse result = wrapper.getData();
                    if (result == null) {
                        return rejectUnauthorized(exchange, "Token validation failed");
                    }

                    // Lưu vào Redis cache (BIC-012)
                    return cacheResult(cacheKey, result)
                            .then(result.isValid()
                                ? forwardWithUserHeaders(exchange, chain, result)
                                : rejectUnauthorized(exchange, "Token is invalid or expired"));
                })
                .onErrorResume(ex -> {
                    log.error("[AUTH] identity-service unreachable: {}", ex.getMessage());
                    return rejectServiceUnavailable(exchange, "Authentication service unavailable");
                });
    }

    // ── Lưu IntrospectResponse vào Redis ──────────────────────────
    private Mono<Boolean> cacheResult(String cacheKey, IntrospectResponse response) {
        try {
            String json = objectMapper.writeValueAsString(response);
            return redisTemplate.opsForValue()
                    .set(cacheKey, json, Duration.ofSeconds(jwtCacheTtlSeconds));
        } catch (Exception e) {
            log.warn("[AUTH] Failed to cache introspect result: {}", e.getMessage());
            return Mono.just(false);
        }
    }

    // ── Forward request với X-User-* headers ──────────────────────
    private Mono<Void> forwardWithUserHeaders(
            ServerWebExchange exchange,
            GatewayFilterChain chain,
            IntrospectResponse introspect) {

        ServerHttpRequest mutated = exchange.getRequest().mutate()
                .header("X-User-Id",    safeString(introspect.getUserId()))
                .header("X-User-Role",  safeString(introspect.getRole()))
                .header("X-User-Email", safeString(introspect.getEmail()))
                .build();

        log.debug("[AUTH] Forward userId={} role={} → {}",
                introspect.getUserId(),
                introspect.getRole(),
                exchange.getRequest().getURI().getPath());

        return chain.filter(exchange.mutate().request(mutated).build());
    }

    // ── Build Redis cache key = SHA256(token) ─────────────────────
    private String buildCacheKey(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder("jwt:");
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return "jwt:" + token.hashCode();
        }
    }

    // ── Response helpers ──────────────────────────────────────────
    private Mono<Void> rejectUnauthorized(ServerWebExchange exchange, String message) {
        return writeErrorResponse(exchange, HttpStatus.UNAUTHORIZED, 1004, message);
    }

    private Mono<Void> rejectServiceUnavailable(ServerWebExchange exchange, String message) {
        return writeErrorResponse(exchange, HttpStatus.SERVICE_UNAVAILABLE, 9002, message);
    }

    private Mono<Void> writeErrorResponse(
            ServerWebExchange exchange,
            HttpStatus status,
            int code,
            String message) {

        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String body = String.format(
                "{\"code\":%d,\"message\":\"%s\",\"data\":null}", code, message);
        DataBuffer buffer = response.bufferFactory()
                .wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    private String safeString(String value) {
        return value != null ? value : "";
    }

    @Override
    public int getOrder() {
        return -1; // sau RequestIdFilter
    }

    // ── Inner class để parse ApiResponse<IntrospectResponse> ─────
    @lombok.Data
    static class IntrospectResponseWrapper {
        private int                code;
        private String             message;
        private IntrospectResponse data;
    }
}