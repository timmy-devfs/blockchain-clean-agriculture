package com.bicap.api_gateway.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

/**
 * BIC-012: Chuẩn hóa tất cả lỗi → ApiResponse { code, message, data: null }
 */
@Component
@Order(-1)
@Slf4j
public class GlobalErrorHandler implements ErrorWebExceptionHandler {

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        HttpStatus status    = HttpStatus.INTERNAL_SERVER_ERROR;
        int        code      = 9001;
        String     message   = "Internal server error";

        if (ex instanceof ResponseStatusException rse) {
            status  = HttpStatus.valueOf(rse.getStatusCode().value());
            code    = status.value();
            message = rse.getReason() != null ? rse.getReason() : status.getReasonPhrase();
        }

        // Map HTTP status → BICAP error code
        if (status == HttpStatus.TOO_MANY_REQUESTS) {
            code    = 9003;
            message = "Rate limit exceeded — please try again later";
        } else if (status == HttpStatus.SERVICE_UNAVAILABLE) {
            code    = 9002;
            message = "Service temporarily unavailable";
        } else if (status == HttpStatus.GATEWAY_TIMEOUT) {
            code    = 9005;
            message = "Upstream service timeout";
        }

        log.error("[ERROR] {} {} → {} {}: {}",
                exchange.getRequest().getMethod(),
                exchange.getRequest().getURI().getPath(),
                status.value(), code, message);

        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String body = String.format(
                "{\"code\":%d,\"message\":\"%s\",\"data\":null}", code, message);
        DataBuffer buffer = exchange.getResponse().bufferFactory()
                .wrap(body.getBytes(StandardCharsets.UTF_8));

        return exchange.getResponse().writeWith(Mono.just(buffer));
    }
}
