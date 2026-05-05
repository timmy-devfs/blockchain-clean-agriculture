package com.bicap.notification.repository;

import com.bicap.notification.model.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {
    Optional<DeviceToken> findByToken(String token);
    void deleteByTokenAndUserId(String token, String userId);
}

