package com.bicap.identity_service.dto.response;

import com.bicap.identity_service.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
//import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    private String        id;        // String thay UUID
    private String        email;
    private String        fullName;
    private String        phone;
    @io.swagger.v3.oas.annotations.media.Schema(implementation = String.class, example = "ADMIN")
    private User.Role role;
    private Boolean       isActive;
    private String        avatarUrl;
    private LocalDateTime createdAt;
}