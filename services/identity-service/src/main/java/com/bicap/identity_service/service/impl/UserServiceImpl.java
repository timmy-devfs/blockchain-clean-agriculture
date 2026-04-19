package com.bicap.identity_service.service.impl;

import com.bicap.identity_service.dto.request.*;
import com.bicap.identity_service.dto.response.*;
import com.bicap.identity_service.entity.User;
import com.bicap.identity_service.exception.AppException;
import com.bicap.identity_service.exception.ErrorCode;
import com.bicap.identity_service.mapper.UserMapper;
import com.bicap.identity_service.repository.UserRepository;
import com.bicap.identity_service.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper      userMapper;

    // ── GET ME ────────────────────────────────────────────────
    @Override
    public UserResponse getMe(String userId) {
        User user = findActiveUserById(userId);
        return userMapper.toResponse(user);
    }

    // ── UPDATE PROFILE ────────────────────────────────────────
    @Override
    @Transactional
    public UserResponse updateProfile(String userId, UpdateProfileRequest request) {
        User user = findActiveUserById(userId);

        // Chỉ cập nhật field nào được gửi lên (không null)
        if (StringUtils.hasText(request.getFullName())) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        User saved = userRepository.save(user);
        log.info("Profile updated: {}", userId);
        return userMapper.toResponse(saved);
    }

    // ── CHANGE PASSWORD ───────────────────────────────────────
    @Override
    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = findActiveUserById(userId);

        // Xác nhận mật khẩu hiện tại
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.WRONG_PASSWORD);
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed: {}", userId);
    }

    // ── ADMIN: GET USERS ──────────────────────────────────────
    @Override
    public PageResponse<UserResponse> getUsers(
            String role, Boolean isActive, int page, int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> userPage;

        // Filter theo role và isActive
        if (role != null && isActive != null) {
            User.Role userRole = parseRole(role);
            userPage = userRepository.findByRoleAndIsActive(userRole, isActive, pageable);
        } else if (role != null) {
            userPage = userRepository.findByRole(parseRole(role), pageable);
        } else if (isActive != null) {
            userPage = userRepository.findByIsActive(isActive, pageable);
        } else {
            userPage = userRepository.findAll(pageable);
        }

        List<UserResponse> content = userMapper.toResponseList(userPage.getContent());

        return PageResponse.<UserResponse>builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .last(userPage.isLast())
                .build();
    }

    // ── ADMIN: CREATE USER ────────────────────────────────────
    @Override
    @Transactional
    public UserResponse adminCreateUser(AdminCreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTS);
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(request.getRole() != null ? request.getRole() : User.Role.ADMIN)
                .isActive(true)
                .build();

        User saved = userRepository.save(user);
        log.info("[ADMIN] Created user: {} [{}]", saved.getEmail(), saved.getRole());
        return userMapper.toResponse(saved);
    }

    // ── ADMIN: UPDATE USER ────────────────────────────────────
    @Override
    @Transactional
    public UserResponse adminUpdateUser(String targetUserId, AdminUpdateUserRequest request) {
        User user = findUserById(targetUserId);   // kể cả inactive

        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }

        User saved = userRepository.save(user);
        log.info("[ADMIN] Updated user {}: role={} isActive={}",
                targetUserId, saved.getRole(), saved.getIsActive());
        return userMapper.toResponse(saved);
    }

    // ── ADMIN: SOFT DELETE ────────────────────────────────────
    @Override
    @Transactional
    public void adminDeleteUser(String targetUserId) {
        User user = findUserById(targetUserId);

        user.setIsActive(false);
        userRepository.save(user);

        log.info("[ADMIN] Soft-deleted user: {}", targetUserId);
        // KHÔNG gọi userRepository.delete() — chỉ set isActive=false
    }

    // ── Private helpers ───────────────────────────────────────

    private User findActiveUserById(String userId) {
        return userRepository.findByIdAndIsActiveTrue(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private User findUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private User.Role parseRole(String role) {
        try {
            return User.Role.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }
    }
}