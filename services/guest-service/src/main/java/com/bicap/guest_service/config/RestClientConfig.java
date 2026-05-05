package com.bicap.guest_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * WebClient beans để gọi farm-service và blockchain-service
 */
@Configuration
public class RestClientConfig {

    @Value("${services.farm.url}")
    private String farmServiceUrl;

    @Value("${services.blockchain.url}")
    private String blockchainServiceUrl;

    @Bean("farmWebClient")
    public WebClient farmWebClient() {
        return WebClient.builder()
                .baseUrl(farmServiceUrl)
                .defaultHeader("X-Gateway-Source", "guest-service")
                .build();
    }

    @Bean("chainWebClient")
    public WebClient chainWebClient() {
        return WebClient.builder()
                .baseUrl(blockchainServiceUrl)
                .build();
    }
}