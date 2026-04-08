package com.bicap.identity_service.service.impl;

import com.bicap.identity_service.dto.request.*;
import com.bicap.identity_service.dto.response.*;
import com.bicap.identity_service.entity.RefreshToken;
import com.bicap.identity_service.entity.User;
import com.bicap.identity_service.exception.AppException;
import com.bicap.identity_service.exception.ErrorCode;
import com.bicap.identity_service.repository.RefreshTokenRepository;
import com.bicap.identity_service.repository.UserRepository;
import com.bicap.identity_service.security.JwtTokenProvider;
import com.bicap.identity_service.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository         userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider       jwtTokenProvider;
    private final PasswordEncoder        passwordEncoder;

    // Đọc TTL từ application.yml (ms → giây)
    @Value("${jwt.access-token-expiry:900000}")
    private long accessTokenExpiryMs;

    @Value("${jwt.refresh-token-expiry:604800000}")
    private long refreshTokenExpiryMs;

    // ── REGISTER ──────────────────────────────────────────────
    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        // Kiểm tra email đã tồn tại
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTS);
        }

        // Tạo User entity
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(request.getRole())
                .isActive(true)
                .build();

        User saved = userRepository.save(user);
        log.info("New user registered: {} [{}]", saved.getEmail(), saved.getRole());

        return toUserResponse(saved);
    }

    // ── LOGIN ─────────────────────────────────────────────────
    @Override
    @Transactional
    public TokenResponse login(LoginRequest request) {
        // Tìm user theo email
        User user = userRepository.findByEmailAndIsActiveTrue(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        // Revoke tất cả refresh token cũ
        refreshTokenRepository.revokeAllByUserId(user.getId());

        // Tạo token pair
        String accessToken  = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtTokenProvider.generateRefreshToken();

        // Lưu refresh token vào DB
        RefreshToken rt = RefreshToken.builder()
                .userId(user.getId())
                .token(refreshToken)
                .expiryDate(LocalDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000))
                .isRevoked(false)
                .build();
        refreshTokenRepository.save(rt);

        log.info("User logged in: {}", user.getEmail());

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(accessTokenExpiryMs / 1000)
                .role(user.getRole().name())
                .user(toUserResponse(user))
                .build();
    }

    // ── REFRESH TOKEN ─────────────────────────────────────────
    @Override
    @Transactional
    public TokenResponse refreshToken(RefreshTokenRequest request) {
        // Tìm refresh token trong DB
        RefreshToken rt = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new AppException(ErrorCode.TOKEN_INVALID));

        // Kiểm tra đã bị revoke chưa
        if (rt.getIsRevoked()) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_REVOKED);
        }

        // Kiểm tra hết hạn chưa
        if (rt.isExpired()) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        // Tìm user
        User user = userRepository.findByIdAndIsActiveTrue(rt.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Revoke token cũ
        rt.setIsRevoked(true);
        refreshTokenRepository.save(rt);

        // Tạo token pair mới
        String newAccessToken  = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken();

        // Lưu refresh token mới
        RefreshToken newRt = RefreshToken.builder()
                .userId(user.getId())
                .token(newRefreshToken)
                .expiryDate(LocalDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000))
                .isRevoked(false)
                .build();
        refreshTokenRepository.save(newRt);

        log.info("Token rotated for user: {}", user.getEmail());

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .expiresIn(accessTokenExpiryMs / 1000)
                .role(user.getRole().name())
                .user(toUserResponse(user))
                .build();
    }

    // ── INTROSPECT ────────────────────────────────────────────
    @Override
    public IntrospectResponse introspect(IntrospectRequest request) {
        // KHÔNG throw exception — trả về valid:false nếu lỗi
        try {
            io.jsonwebtoken.Claims claims =
                    jwtTokenProvider.extractAllClaims(request.getToken());

            return IntrospectResponse.builder()
                    .valid(true)
                    .userId(claims.getSubject())
                    .email(claims.get("email", String.class))
                    .role(claims.get("role",  String.class))
                    .build();

        } catch (Exception ex) {
            log.debug("Introspect failed: {}", ex.getMessage());
            return IntrospectResponse.builder()
                    .valid(false)
                    .build();
        }
    }

    // ── Helper ────────────────────────────────────────────────
    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .build();
    }
}