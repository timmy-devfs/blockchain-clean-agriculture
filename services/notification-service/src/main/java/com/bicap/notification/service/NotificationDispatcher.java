package com.bicap.notification.service;

import com.bicap.notification.client.FCMPushClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class NotificationDispatcher {

    private final TokenCacheService tokenCacheService;
    private final FCMPushClient fcmPushClient;

    public NotificationDispatcher(TokenCacheService tokenCacheService, FCMPushClient fcmPushClient) {
        this.tokenCacheService = tokenCacheService;
        this.fcmPushClient = fcmPushClient;
    }

    public void notifyUser(String userId, String title, String body, Map<String, String> data) {
        Set<String> tokens = tokenCacheService.getTokens(userId);
        fcmPushClient.sendMulticast(List.copyOf(tokens), title, body, data);
    }
}

