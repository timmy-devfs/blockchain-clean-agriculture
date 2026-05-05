package com.bicap.shipping.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
public class IdentityProvisionClient {

    private final RestTemplate restTemplate;

    @Value("${bicap.identity.base-url:http://localhost:8081}")
    private String identityBaseUrl;

    @Value("${bicap.identity.default-driver-password:123456}")
    private String defaultDriverPassword;

    public IdentityProvisionClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String registerShipper(String fullName, String phone) {
        String email = buildProvisionEmail(phone);
        Map<String, Object> body = new HashMap<>();
        body.put("email", email);
        body.put("password", defaultDriverPassword);
        body.put("fullName", (fullName == null || fullName.isBlank()) ? "Driver Auto Provision" : fullName);
        if (phone != null && !phone.isBlank()) {
            body.put("phone", phone);
        }
        body.put("role", "SHIPPER");

        ResponseEntity<Map> response = restTemplate.exchange(
                identityBaseUrl + "/api/auth/register",
                HttpMethod.POST,
                new HttpEntity<>(body),
                Map.class
        );
        Map payload = response.getBody();
        if (payload == null || !(payload.get("data") instanceof Map data) || data.get("id") == null) {
            throw new IllegalStateException("Identity register response missing user id");
        }
        return String.valueOf(data.get("id"));
    }

    private String buildProvisionEmail(String phone) {
        String digits = phone == null ? "" : phone.replaceAll("[^0-9]", "");
        if (digits.isBlank()) {
            digits = "driver";
        }
        return "shipper+" + digits + "." + System.currentTimeMillis() + "@bicap.io";
    }
}
