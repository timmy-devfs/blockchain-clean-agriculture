package com.bicap.notification.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Collections;
import java.util.Set;

@Service
public class TokenCacheService {

    private static final Duration TOKEN_TTL = Duration.ofDays(30);

    private final StringRedisTemplate redisTemplate;

    public TokenCacheService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void addToken(String userId, String token) {
        String key = keyForUser(userId);
        redisTemplate.opsForSet().add(key, token);
        redisTemplate.expire(key, TOKEN_TTL);
    }

    public void removeToken(String userId, String token) {
        redisTemplate.opsForSet().remove(keyForUser(userId), token);
    }

    public Set<String> getTokens(String userId) {
        Set<String> tokens = redisTemplate.opsForSet().members(keyForUser(userId));
        return tokens == null ? Collections.emptySet() : tokens;
    }

    private String keyForUser(String userId) {
        return "tokens:" + userId;
    }
}

