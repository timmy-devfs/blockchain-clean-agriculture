package com.bicap.notification.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public abstract class BaseJsonConsumer {

    private final ObjectMapper objectMapper = new ObjectMapper();

    protected JsonNode parse(String raw) {
        try {
            return objectMapper.readTree(raw);
        } catch (Exception ex) {
            log.warn("Invalid Kafka payload: {}", raw, ex);
            return null;
        }
    }

    protected String text(JsonNode node, String field) {
        if (node == null || !node.has(field)) {
            return null;
        }
        return node.get(field).asText();
    }
}

