package com.bicap.identity_service.repository;

import com.bicap.identity_service.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
//import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {
    Optional<RefreshToken> findByToken(String token);
    Optional<RefreshToken> findByUserIdAndIsRevokedFalse(String userId);

    @Modifying @Transactional
    @Query("UPDATE RefreshToken rt SET rt.isRevoked = true WHERE rt.userId = :userId")
    void revokeAllByUserId(String userId);

    @Modifying @Transactional
    void deleteByExpiryDateBefore(LocalDateTime dateTime);

    int countByUserIdAndIsRevokedFalse(String userId);
}