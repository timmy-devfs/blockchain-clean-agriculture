package com.bicap.notification.service;

import com.bicap.notification.dto.TokenUpsertRequest;
import com.bicap.notification.model.DeviceToken;
import com.bicap.notification.repository.DeviceTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DeviceTokenService {

    private final DeviceTokenRepository deviceTokenRepository;
    private final TokenCacheService tokenCacheService;

    public DeviceTokenService(DeviceTokenRepository deviceTokenRepository, TokenCacheService tokenCacheService) {
        this.deviceTokenRepository = deviceTokenRepository;
        this.tokenCacheService = tokenCacheService;
    }

    @Transactional
    public void registerToken(String userId, TokenUpsertRequest request) {
        DeviceToken entity = deviceTokenRepository.findByToken(request.getToken())
                .orElseGet(DeviceToken::new);
        entity.setUserId(userId);
        entity.setToken(request.getToken());
        entity.setPlatform(request.getPlatform());
        deviceTokenRepository.save(entity);
        tokenCacheService.addToken(userId, request.getToken());
    }

    @Transactional
    public void deleteToken(String userId, String token) {
        deviceTokenRepository.deleteByTokenAndUserId(token, userId);
        tokenCacheService.removeToken(userId, token);
    }
}

