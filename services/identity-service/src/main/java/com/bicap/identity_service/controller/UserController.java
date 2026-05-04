package com.bicap.identity_service.controller;

import com.bicap.identity_service.common.ApiResponse;
import com.bicap.identity_service.dto.request.*;
import com.bicap.identity_service.dto.response.*;
import com.bicap.identity_service.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "User", description = "User profile & Admin user management")
public class UserController {

    private final UserService userService;

    // ════════════════════════════════════════════════════════
    // USER SELF-SERVICE
    // ════════════════════════════════════════════════════════

    /**
     * GET /api/auth/me
     * Gateway forward X-User-Id header sau khi validate JWT
     */
    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin user hiện tại (đọc X-User-Id từ Gateway)")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lấy thông tin thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Thiếu hoặc sai JWT")
    })
    public ApiResponse<UserResponse> getMe(
            @RequestHeader("X-User-Id") String userId) {

        return ApiResponse.success(userService.getMe(userId));
    }

    /**
     * PUT /api/auth/profile
     * Cập nhật fullName, phone, avatarUrl — KHÔNG đổi email/role
     */
    @PutMapping("/profile")
    @Operation(summary = "Cập nhật profile (fullName, phone, avatar)")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cập nhật thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Payload không hợp lệ")
    })
    public ApiResponse<UserResponse> updateProfile(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody UpdateProfileRequest request) {

        return ApiResponse.success(userService.updateProfile(userId, request));
    }

    /**
     * PUT /api/auth/change-password
     * Xác nhận currentPassword trước khi đổi
     */
    @PutMapping("/change-password")
    @Operation(summary = "Đổi mật khẩu — cần xác nhận mật khẩu hiện tại")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Đổi mật khẩu thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Mật khẩu không hợp lệ")
    })
    public ApiResponse<Void> changePassword(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody ChangePasswordRequest request) {

        userService.changePassword(userId, request);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("Password changed successfully")
                .build();
    }

    // ════════════════════════════════════════════════════════
    // ADMIN MANAGEMENT
    // ════════════════════════════════════════════════════════

    /**
     * GET /api/auth/admin/users
     * Chỉ ADMIN — Gateway forward X-User-Role
     */
    @GetMapping("/admin/users")
    @Operation(summary = "[ADMIN] Danh sách users với filter và phân trang")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền admin")
    })
    public ApiResponse<PageResponse<UserResponse>> getUsers(
            @RequestHeader("X-User-Role") String callerRole,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        checkAdminRole(callerRole);
        return ApiResponse.success(userService.getUsers(role, isActive, page, size));
    }

    /**
     * GET /api/auth/shippers
     * Dùng cho shipping dashboard dropdown tài xế (nguồn identity users role SHIPPER).
     */
    @GetMapping("/shippers")
    @Operation(summary = "Danh sách tài khoản SHIPPER đang hoạt động")
    public ApiResponse<List<UserResponse>> getShippers(
            @RequestHeader("X-User-Role") String callerRole,
            @RequestParam(defaultValue = "200") int size) {

        checkAllowedRole(callerRole, "ADMIN", "SHIPPER", "SHIPPING_MANAGER");
        PageResponse<UserResponse> page = userService.getUsers("SHIPPER", true, 0, Math.max(size, 1));
        return ApiResponse.success(page.getContent());
    }

    /**
     * POST /api/auth/admin/users
     * Tạo tài khoản ADMIN mới
     */
    @PostMapping("/admin/users")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "[ADMIN] Tạo tài khoản admin mới")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Tạo user thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Payload không hợp lệ")
    })
    public ApiResponse<UserResponse> adminCreateUser(
            @RequestHeader("X-User-Role") String callerRole,
            @Valid @RequestBody AdminCreateUserRequest request) {

        checkAdminRole(callerRole);
        UserResponse result = userService.adminCreateUser(request);
        return ApiResponse.<UserResponse>builder()
                .code(201)
                .message("User created successfully")
                .data(result)
                .build();
    }

    /**
     * PUT /api/auth/admin/users/{id}
     * Đổi role hoặc toggle isActive
     */
    @PutMapping("/admin/users/{id}")
    @Operation(summary = "[ADMIN] Cập nhật role hoặc isActive của user")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cập nhật thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User không tồn tại")
    })
    public ApiResponse<UserResponse> adminUpdateUser(
            @RequestHeader("X-User-Role") String callerRole,
            @PathVariable String id,
            @Valid @RequestBody AdminUpdateUserRequest request) {

        checkAdminRole(callerRole);
        return ApiResponse.success(userService.adminUpdateUser(id, request));
    }

    /**
     * DELETE /api/auth/admin/users/{id}
     * Soft delete: isActive = false, KHÔNG xóa record
     */
    @DeleteMapping("/admin/users/{id}")
    @Operation(summary = "[ADMIN] Soft delete user (isActive=false)")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Deactivate thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User không tồn tại")
    })
    public ApiResponse<Void> adminDeleteUser(
            @RequestHeader("X-User-Role") String callerRole,
            @PathVariable String id) {

        checkAdminRole(callerRole);
        userService.adminDeleteUser(id);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("User deactivated successfully")
                .build();
    }

    // ── Helper: kiểm tra role ADMIN ───────────────────────────
    private void checkAdminRole(String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new com.bicap.identity_service.exception.AppException(
                    com.bicap.identity_service.exception.ErrorCode.INSUFFICIENT_PERM);
        }
    }

    private void checkAllowedRole(String callerRole, String... allowedRoles) {
        if (callerRole == null) {
            throw new com.bicap.identity_service.exception.AppException(
                    com.bicap.identity_service.exception.ErrorCode.INSUFFICIENT_PERM);
        }
        for (String allowed : allowedRoles) {
            if (allowed.equalsIgnoreCase(callerRole)) {
                return;
            }
        }
        throw new com.bicap.identity_service.exception.AppException(
                com.bicap.identity_service.exception.ErrorCode.INSUFFICIENT_PERM);
    }
}