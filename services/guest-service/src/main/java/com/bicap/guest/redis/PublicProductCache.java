package com.bicap.guest.redis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

/**
 * Cache public product listings
 * Key: public:products:{paramHash}
 * TTL: 10 phút (configurable)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PublicProductCache {

    private final StringRedisTemplate redisTemplate;

    @Value("${cache.public-products-ttl-seconds:600}")
    private long ttlSeconds;

    private static final String KEY_PREFIX = "public:products:";

    public Optional<String> get(String params) {
        String key   = buildKey(params);
        String value = redisTemplate.opsForValue().get(key);
        if (value != null) {
            log.debug("[CACHE HIT] {}", key);
            return Optional.of(value);
        }
        log.debug("[CACHE MISS] {}", key);
        return Optional.empty();
    }

    public void set(String params, String jsonValue) {
        String key = buildKey(params);
        redisTemplate.opsForValue().set(key, jsonValue, Duration.ofSeconds(ttlSeconds));
        log.debug("[CACHE SET] {} TTL={}s", key, ttlSeconds);
    }

    public void evict(String params) {
        redisTemplate.delete(buildKey(params));
    }

    private String buildKey(String params) {
        return KEY_PREFIX + params.hashCode();
    }
}