package com.bicap.identity_service.security;

import com.bicap.identity_service.config.JwtConfig;
import com.bicap.identity_service.exception.AppException;
import com.bicap.identity_service.exception.ErrorCode;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtTokenProvider {

    private final JwtConfig jwtConfig;

    // ── Build signing key từ secret string ────────────────────
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(
                java.util.Base64.getEncoder()
                        .encodeToString(jwtConfig.getSecret().getBytes())
        );
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // ── Generate Access Token ─────────────────────────────────
    public String generateAccessToken(String userId, String email, String role) {
        Date now    = new Date();
        Date expiry = new Date(now.getTime() + jwtConfig.getAccessTokenExpiry());

        return Jwts.builder()
                .subject(userId.toString())          // sub = userId
                .claim("email", email)
                .claim("role", role)
                .claim("type", "ACCESS")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    // ── Generate Refresh Token (opaque UUID) ──────────────────
    public String generateRefreshToken() {
        return UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
    }

    // ── Validate token & extract Claims ───────────────────────
    public Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException ex) {
            log.warn("JWT expired: {}", ex.getMessage());
            throw new AppException(ErrorCode.TOKEN_EXPIRED);
        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("JWT invalid: {}", ex.getMessage());
            throw new AppException(ErrorCode.TOKEN_INVALID);
        }
    }

    // ── Extract individual claims ─────────────────────────────
    public String extractUserId(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).get("email", String.class);
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    // ── Validate (return true/false thay vì throw) ────────────
    public boolean validateToken(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (AppException ex) {
            return false;
        }
    }

    // ── Build IntrospectResponse data ─────────────────────────
    public Map<String, Object> introspect(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return Map.of(
                    "valid",  true,
                    "userId", claims.getSubject(),
                    "email",  claims.get("email", String.class),
                    "role",   claims.get("role",  String.class)
            );
        } catch (AppException ex) {
            return Map.of("valid", false);
        }
    }
}