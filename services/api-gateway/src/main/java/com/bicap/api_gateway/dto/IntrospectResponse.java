package com.bicap.api_gateway.dto;

import lombok.Data;

/**
 * Response nhận từ identity-service /api/auth/introspect
 */
@Data
public class IntrospectResponse {
    private boolean valid;
    private String  userId;
    private String  email;
    private String  role;
}