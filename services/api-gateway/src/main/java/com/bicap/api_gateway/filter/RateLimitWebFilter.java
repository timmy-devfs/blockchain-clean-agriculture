package com.bicap.api_gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;

/**
 * BIC-012: Rate limit — 100 req/phút (anonymous), 500 req/phút (authenticated).
 * Chạy trước tất cả (WebFilter), áp dụng cho mọi request kể cả /api/gateway/health.
 * Key theo IP (hỗ trợ X-Forwarded-For từ Nginx).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class RateLimitWebFilter implements WebFilter {

    private static final String KEY_PREFIX_ANON = "rl:anon:";
    private static final String KEY_PREFIX_AUTH = "rl:auth:";
    private static final int WINDOW_SECONDS = 90; // TTL key > 1 phút để tránh reset sớm
    private static final int BICAP_ERROR_CODE_RATE_LIMIT = 9003;

    @Value("${gateway.rate-limit.anonymous-per-minute:100}")
    private int anonymousPerMinute;

    @Value("${gateway.rate-limit.authenticated-per-minute:500}")
    private int authenticatedPerMinute;

    @Value("${gateway.rate-limit.exclude-paths:}")
    private String excludePathsCsv;

    private final ReactiveStringRedisTemplate redisTemplate;

    public RateLimitWebFilter(ReactiveStringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        if (isExcluded(path)) {
            log.debug("[RATE-LIMIT] Excluded path: {}", path);
            return chain.filter(exchange);
        }

        String clientIp = resolveClientIp(exchange);
        boolean hasBearer = hasBearerToken(exchange);
        int limit = hasBearer ? authenticatedPerMinute : anonymousPerMinute;
        String prefix = hasBearer ? KEY_PREFIX_AUTH : KEY_PREFIX_ANON;
        String key = buildKey(prefix, clientIp);

        return redisTemplate.opsForValue().increment(key)
                .flatMap(count -> {
                    if (count == 1) {
                        return redisTemplate.expire(key, java.time.Duration.ofSeconds(WINDOW_SECONDS))
                                .thenReturn(count);
                    }
                    return Mono.just(count);
                })
                .flatMap(count -> {
                    if (count > limit) {
                        log.warn("[RATE-LIMIT] {} exceeded limit {} for key {}", clientIp, limit, key);
                        return write429Response(exchange);
                    }
                    addRateLimitHeaders(exchange, limit, (int) (limit - count));
                    return chain.filter(exchange);
                })
                .onErrorResume(ex -> {
                    log.error("[RATE-LIMIT] Redis error, allowing request: {}", ex.getMessage());
                    return chain.filter(exchange);
                });
    }

    private boolean isExcluded(String path) {
        if (excludePathsCsv == null || excludePathsCsv.isBlank()) {
            return false;
        }
        return Arrays.stream(excludePathsCsv.split(","))
                .map(String::trim)
                .filter(p -> !p.isEmpty())
                .anyMatch(path::startsWith);
    }

    private String resolveClientIp(ServerWebExchange exchange) {
        String forwarded = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = exchange.getRequest().getHeaders().getFirst("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp;
        }
        if (exchange.getRequest().getRemoteAddress() != null) {
            return exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
        }
        return "unknown";
    }

    private boolean hasBearerToken(ServerWebExchange exchange) {
        String auth = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        return auth != null && auth.startsWith("Bearer ");
    }

    private String buildKey(String prefix, String clientIp) {
        String window = Instant.now().truncatedTo(ChronoUnit.MINUTES).toString();
        return prefix + clientIp + ":" + window;
    }

    private Mono<Void> write429Response(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = String.format(
                "{\"code\":%d,\"message\":\"%s\",\"data\":null}",
                BICAP_ERROR_CODE_RATE_LIMIT,
                "Rate limit exceeded — please try again later"
        );
        return exchange.getResponse().writeWith(
                Mono.just(exchange.getResponse().bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8))));
    }

    private void addRateLimitHeaders(ServerWebExchange exchange, int limit, int remaining) {
        exchange.getResponse().getHeaders().add("X-RateLimit-Limit", String.valueOf(limit));
        exchange.getResponse().getHeaders().add("X-RateLimit-Remaining", String.valueOf(Math.max(0, remaining)));
    }
}
