package com.bicap.notification.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;

@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${app.firebase.service-account-path}")
    private String serviceAccountPath;

    @Bean
    public FirebaseMessaging firebaseMessaging() {
        try {
            // Không dùng try-with-resources cho stream ở đây để tránh đóng stream quá sớm 
            // trước khi Firebase kịp xác thực hoàn toàn với Google Server
            FileInputStream serviceAccount = new FileInputStream(serviceAccountPath);
            
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            FirebaseApp app = FirebaseApp.getApps().isEmpty()
                    ? FirebaseApp.initializeApp(options)
                    : FirebaseApp.getInstance();

            log.info(">>>> Firebase initialized successfully!");
            return FirebaseMessaging.getInstance(app);
        } catch (IOException ex) {
            log.error("!!!! Firebase initialization FAILED: {}", ex.getMessage());
            return null; // Trả về null nếu lỗi
        }
    }
}