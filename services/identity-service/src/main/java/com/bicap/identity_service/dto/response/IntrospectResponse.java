package com.bicap.identity_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntrospectResponse {

    @Schema(description = "Token có hợp lệ hay không", example = "true")
    private boolean valid;
    @Schema(description = "User ID nếu token hợp lệ", example = "8f6b507e-1c54-45b7-96fa-2f3c11a8ac4d")
    private String  userId;    // null nếu invalid
    @Schema(description = "Email nếu token hợp lệ", example = "user@bicap.vn")
    private String  email;     // null nếu invalid
    @Schema(description = "Role nếu token hợp lệ", example = "FARM_MANAGER")
    private String  role;      // null nếu invalid
}