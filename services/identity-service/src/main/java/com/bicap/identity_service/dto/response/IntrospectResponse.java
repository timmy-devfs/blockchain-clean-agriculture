package com.bicap.identity_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntrospectResponse {

    private boolean valid;
    private String  userId;    // null nếu invalid
    private String  email;     // null nếu invalid
    private String  role;      // null nếu invalid
}