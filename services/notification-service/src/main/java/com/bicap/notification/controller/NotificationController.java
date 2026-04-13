package com.bicap.notification.controller;

import com.bicap.notification.model.Notification;
import com.bicap.notification.service.NotificationService;
import com.bicap.notification.service.TokenCacheService;
import com.bicap.notification.client.FCMPushClient;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService service;
    private final TokenCacheService tokenCache;
    private final FCMPushClient fcmClient;

    public NotificationController(NotificationService service, TokenCacheService tokenCache, FCMPushClient fcmClient) {
        this.service = service;
        this.tokenCache = tokenCache;
        this.fcmClient = fcmClient;
    }

    // Lấy ID người dùng từ Security hoặc Header để test
    private String getUserId(Authentication auth, String headerId) {
        return (auth != null) ? auth.getName() : headerId;
    }

    @GetMapping
    public Page<Notification> getMyNotifications(
            Authentication auth, 
            @RequestHeader(value = "X-User-Id", required = false) String headerId,
            @RequestParam(required = false) Boolean isRead,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        String userId = getUserId(auth, headerId);
        if (userId == null) return Page.empty();
        
        return service.getNotifications(userId, isRead, pageable);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(
            Authentication auth,
            @RequestHeader(value = "X-User-Id", required = false) String headerId) {
        
        String userId = getUserId(auth, headerId);
        if (userId == null) return ResponseEntity.badRequest().build();
        
        return ResponseEntity.ok(service.getUnreadCount(userId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            Authentication auth, 
            @RequestHeader(value = "X-User-Id", required = false) String headerId,
            @PathVariable Long id) {
        
        String userId = getUserId(auth, headerId);
        if (userId == null) return ResponseEntity.status(401).build();
        
        service.markAsRead(userId, id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            Authentication auth,
            @RequestHeader(value = "X-User-Id", required = false) String headerId) {
        
        String userId = getUserId(auth, headerId);
        if (userId == null) return ResponseEntity.status(401).build();
        
        service.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            Authentication auth, 
            @RequestHeader(value = "X-User-Id", required = false) String headerId,
            @PathVariable Long id) {
        
        String userId = getUserId(auth, headerId);
        if (userId == null) return ResponseEntity.status(401).build();
        
        service.deleteNotification(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> broadcast(@RequestBody Map<String, String> req) {
        String role = req.get("targetRole");
        String title = req.get("title");
        String body = req.get("body");

        Set<String> tokens = tokenCache.getTokensByRole(role);
        if (!tokens.isEmpty()) {
            fcmClient.sendMulticast(List.copyOf(tokens), title, body, Map.of());
            return ResponseEntity.ok("Sent to " + tokens.size() + " devices");
        }
        return ResponseEntity.ok("No devices found for role: " + role);
    }
}