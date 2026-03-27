package com.bicap.api_gateway.health;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

/**
 * BIC-012: GET /api/gateway/health
 * Ping health check của tất cả 10 services
 */
@RestController
@RequestMapping("/api/gateway")
@Slf4j
public class GatewayHealthController {

    private final WebClient webClient;

    public GatewayHealthController(WebClient.Builder builder) {
        this.webClient = builder.build();
    }

    // Map service name → health URL
    private static final Map<String, String> SERVICES = Map.of(
            "identity-service",      "http://localhost:8081/actuator/health",
            "farm-service",          "http://localhost:8082/actuator/health",
            "retailer-service",      "http://localhost:8083/actuator/health",
            "shipping-service",      "http://localhost:8084/actuator/health",
            "notification-service",  "http://localhost:8085/actuator/health",
            "payment-service",       "http://localhost:8086/actuator/health",
            "iot-service",           "http://localhost:8087/actuator/health",
            "report-service",        "http://localhost:8088/actuator/health",
            "guest-service",         "http://localhost:8089/actuator/health",
            "blockchain-service",    "http://localhost:8090/health"
    );

    @GetMapping("/health")
    public Mono<Map<String, Object>> health() {
        return Flux.fromIterable(SERVICES.entrySet())
                .flatMap(entry -> checkService(entry.getKey(), entry.getValue()))
                .collectMap(ServiceStatus::getName, ServiceStatus::getStatus)
                .map(statuses -> Map.of(
                        "gateway", "UP",
                        "services", statuses
                ));
    }

    private Mono<ServiceStatus> checkService(String name, String url) {
        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(3))
                .map(body -> new ServiceStatus(name, "UP"))
                .onErrorReturn(new ServiceStatus(name, "DOWN"));
    }

    record ServiceStatus(String name, String status) {
        public String getName() { return name; }
        public String getStatus() { return status; }
    }
}