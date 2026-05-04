package com.bicap.shipping.dto;

public record ProvisionDriverRequest(
        String identityUserId,
        String fullName,
        String phone
) {
}
