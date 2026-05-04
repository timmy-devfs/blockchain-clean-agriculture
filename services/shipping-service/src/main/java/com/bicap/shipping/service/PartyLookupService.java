package com.bicap.shipping.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import java.util.Optional;

/**
 * Gọi farm-service / retailer-service lấy tên hiển thị từ Mongo ObjectId.
 */
@Service
public class PartyLookupService {

    private static final int MONGO_OBJECT_ID_LEN = 24;

    private final RestTemplate restTemplate;
    private final String farmBaseUrl;
    private final String retailerBaseUrl;

    public PartyLookupService(
            RestTemplate restTemplate,
            @Value("${bicap.farm.base-url:http://localhost:8082}") String farmBaseUrl,
            @Value("${bicap.retailer.base-url:http://localhost:8083}") String retailerBaseUrl
    ) {
        this.restTemplate = restTemplate;
        this.farmBaseUrl = farmBaseUrl.replaceAll("/+$", "");
        this.retailerBaseUrl = retailerBaseUrl.replaceAll("/+$", "");
    }

    public static boolean isMongoObjectId(String value) {
        if (value == null || value.length() != MONGO_OBJECT_ID_LEN) {
            return false;
        }
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if ((c < '0' || c > '9') && (c < 'a' || c > 'f') && (c < 'A' || c > 'F')) {
                return false;
            }
        }
        return true;
    }

    public Optional<String> fetchFarmName(String farmObjectId) {
        if (!isMongoObjectId(farmObjectId)) {
            return Optional.empty();
        }
        String url = farmBaseUrl + "/api/farm/marketplace/farms/" + farmObjectId;
        try {
            JsonNode root = restTemplate.getForObject(url, JsonNode.class);
            if (root == null || !root.hasNonNull("name")) {
                return Optional.empty();
            }
            String name = root.get("name").asText(null);
            if (name == null || name.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(name.trim());
        } catch (RestClientException e) {
            return Optional.empty();
        }
    }

    public Optional<String> fetchRetailerName(String retailerObjectId) {
        if (retailerObjectId == null || retailerObjectId.isBlank()) {
            return Optional.empty();
        }
        String url = retailerBaseUrl + "/api/retail/marketplace/retailers/" + retailerObjectId;
        try {
            JsonNode root = restTemplate.getForObject(url, JsonNode.class);
            if (root == null || !root.hasNonNull("name")) {
                return Optional.empty();
            }
            String name = root.get("name").asText(null);
            if (name == null || name.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(name.trim());
        } catch (RestClientException e) {
            return Optional.empty();
        }
    }
}
