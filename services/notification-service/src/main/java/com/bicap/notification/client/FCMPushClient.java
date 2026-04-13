package com.bicap.notification.client;

import com.google.firebase.messaging.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
public class FCMPushClient {

    private final FirebaseMessaging firebaseMessaging;

    // Constructor nhận Optional từ FirebaseConfig
    public FCMPushClient(Optional<FirebaseMessaging> firebaseMessagingOpt) {
        this.firebaseMessaging = firebaseMessagingOpt.orElse(null);
        if (this.firebaseMessaging == null) {
            log.error("!!!! Firebase Messaging is NOT initialized. FCM features are disabled.");
        }
    }

    /**
     * Gửi thông báo đến một thiết bị cụ thể qua Token
     */
    @Async
    public void sendToDevice(String token, String title, String body, Map<String, String> data) {
        if (token == null || token.isBlank()) return;
        
        if (firebaseMessaging == null) {
            log.warn(">>>> Skip device FCM: Firebase is not initialized.");
            return;
        }

        Message message = Message.builder()
                .setToken(token)
                .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                .putAllData(data == null ? Map.of() : data)
                .build();

        try {
            String response = firebaseMessaging.send(message);
            log.info(">>>> FCM sent to device successfully. MessageId: {}", response);
        } catch (Exception ex) {
            log.error("!!!! Failed to send FCM to device. Token: {}", token, ex);
        }
    }

    /**
     * Gửi thông báo đến danh sách nhiều Token (Multicast)
     */
    @Async
    public void sendMulticast(List<String> tokens, String title, String body, Map<String, String> data) {
        if (tokens == null || tokens.isEmpty()) return;

        if (firebaseMessaging == null) {
            log.warn(">>>> Skip multicast FCM: Firebase is not initialized. size={}", tokens.size());
            return;
        }

        MulticastMessage message = MulticastMessage.builder()
                .addAllTokens(tokens)
                .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                .putAllData(data == null ? Map.of() : data)
                .build();

        try {
            log.info(">>>> Attempting to send multicast FCM to {} tokens...", tokens.size());
            BatchResponse response = firebaseMessaging.sendEachForMulticast(message);
            
            log.info(">>>> FCM sent. Success: {}, Failure: {}", response.getSuccessCount(), response.getFailureCount());
            
            if (response.getFailureCount() > 0) {
                // Log chi tiết lý do thất bại của từng token (ví dụ: token expired)
                response.getResponses().forEach(res -> {
                    if (!res.isSuccessful()) {
                        log.warn(">>>> Failed token error: {}", res.getException().getMessage());
                    }
                });
            }
        } catch (Exception ex) {
            log.error("!!!! Critical error during multicast FCM sending", ex);
        }
    }

    /**
     * Gửi thông báo theo Topic (Ví dụ: thông báo chung cho toàn bộ nông dân)
     */
    @Async
    public void sendToTopic(String topic, String title, String body) {
        if (topic == null || topic.isBlank()) return;

        if (firebaseMessaging == null) {
            log.warn(">>>> Skip topic FCM: Firebase is not initialized. topic={}", topic);
            return;
        }

        Message message = Message.builder()
                .setTopic(topic)
                .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                .build();

        try {
            firebaseMessaging.send(message);
            log.info(">>>> FCM sent to topic: {}", topic);
        } catch (Exception ex) {
            log.error("!!!! Failed to send FCM to topic: {}", topic, ex);
        }
    }
}