package com.bicap.api_gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Gán X-Request-Id UUID cho mỗi request — dùng để trace log xuyên service
 */
@Component
@Slf4j
public class RequestIdFilter implements GlobalFilter, Ordered {

    public static final String REQUEST_ID_HEADER = "X-Request-Id";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String requestId = UUID.randomUUID().toString();

        // Thêm vào request forward đến downstream
        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .header(REQUEST_ID_HEADER, requestId)
                .build();

        // Thêm vào response trả về client
        exchange.getResponse().getHeaders()
                .add(REQUEST_ID_HEADER, requestId);

        log.debug("[REQUEST-ID] {} {} → {}", requestId,
                exchange.getRequest().getMethod(),
                exchange.getRequest().getURI().getPath());

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    @Override
    public int getOrder() {
        return -2; // sau LoggingFilter
    }
}