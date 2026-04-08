package com.bicap.api_gateway.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Circuit Breaker fallback — trả về response thân thiện khi service down
 */
@RestController
@RequestMapping("/fallback")
@Slf4j
public class FallbackController {

    @RequestMapping("/{service}")
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public Mono<Map<String, Object>> fallback(@PathVariable String service) {
        log.warn("[CIRCUIT BREAKER] Fallback triggered for: {}", service);
        return Mono.just(Map.of(
                "code",    9002,
                "message", service + " service is temporarily unavailable. Please try again later.",
                "data",    Map.of()
        ));
    }
}