package com.bicap.identity_service.service;

import com.bicap.identity_service.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class ShippingProvisionClient {

    private final RestTemplate restTemplate;

    @Value("${bicap.shipping.base-url:http://localhost:8084}")
    private String shippingBaseUrl;

    @Value("${bicap.internal.provision-token:bicap-dev-internal}")
    private String internalProvisionToken;

    public ShippingProvisionClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public void ensureDriverMapped(User user) {
        Map<String, Object> req = new HashMap<>();
        req.put("identityUserId", user.getId());
        req.put("fullName", user.getFullName());
        req.put("phone", user.getPhone());

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Bicap-Internal-Token", internalProvisionToken);

        try {
            restTemplate.exchange(
                    shippingBaseUrl + "/api/shipping/internal/provision-driver",
                    HttpMethod.POST,
                    new HttpEntity<>(req, headers),
                    Map.class
            );
        } catch (Exception ex) {
            // không fail flow đăng ký nếu mapping driver tạm lỗi
            log.warn("Failed to provision shipping driver for user {} ({})", user.getEmail(), user.getId(), ex);
        }
    }
}
