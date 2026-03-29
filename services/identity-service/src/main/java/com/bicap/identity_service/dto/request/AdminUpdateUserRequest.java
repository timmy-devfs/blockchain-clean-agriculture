package com.bicap.identity_service.dto.request;

import com.bicap.identity_service.entity.User;
import lombok.Data;

@Data
public class AdminUpdateUserRequest {

    // null = không đổi
    private User.Role role;

    // null = không đổi
    private Boolean isActive;
}