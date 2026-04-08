package com.bicap.identity_service.service;

import com.bicap.identity_service.dto.request.*;
import com.bicap.identity_service.dto.response.*;

public interface UserService {

    // ── User self-service ────────────────────────────────────
    UserResponse    getMe(String userId);
    UserResponse    updateProfile(String userId, UpdateProfileRequest request);
    void            changePassword(String userId, ChangePasswordRequest request);

    // ── Admin management ─────────────────────────────────────
    PageResponse<UserResponse> getUsers(String role, Boolean isActive, int page, int size);
    UserResponse    adminCreateUser(AdminCreateUserRequest request);
    UserResponse    adminUpdateUser(String targetUserId, AdminUpdateUserRequest request);
    void            adminDeleteUser(String targetUserId);
}