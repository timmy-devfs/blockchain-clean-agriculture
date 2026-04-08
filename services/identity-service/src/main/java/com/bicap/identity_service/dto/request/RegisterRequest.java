package com.bicap.identity_service.dto.request;

import com.bicap.identity_service.entity.User;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 255)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be 6–100 characters")
    private String password;

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 255)
    private String fullName;

    @Pattern(regexp = "^[0-9]{10,11}$", message = "Phone must be 10–11 digits")
    private String phone;

    @NotNull(message = "Role is required")
    private User.Role role;
}