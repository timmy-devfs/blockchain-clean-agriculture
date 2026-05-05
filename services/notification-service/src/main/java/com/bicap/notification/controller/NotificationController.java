package com.bicap.notification.controller;

import com.bicap.notification.dto.SendPushRequest;
import com.bicap.notification.model.Notification;
import com.bicap.notification.service.NotificationDispatcher;
import com.bicap.notification.service.NotificationService;
import com.bicap.notification.service.TokenCacheService;
import com.bicap.notification.client.FCMPushClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

@RestController
@RequestMapping("/notifications")
@Tag(name = "Notifications", description = "Read/update notifications and admin broadcast")
public class NotificationController {

    private final NotificationService service;
    private final TokenCacheService tokenCache;
    private final FCMPushClient fcmClient;
    private final NotificationDispatcher notificationDispatcher;

    public NotificationController(
            NotificationService service,
            TokenCacheService tokenCache,
            FCMPushClient fcmClient,
            NotificationDispatcher notificationDispatcher) {
        this.service = service;
        this.tokenCache = tokenCache;
        this.fcmClient = fcmClient;
        this.notificationDispatcher = notificationDispatcher;
    }

    // Lấy ID người dùng từ Security hoặc Header để test
    private String getUserId(Authentication auth, String headerId) {
        return (auth != null) ? auth.getName() : headerId;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách thông báo của user")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công"),
            @ApiResponse(responseCode = "401", description = "Thiếu định danh user")
    })
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
    @Operation(summary = "Đếm số thông báo chưa đọc")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Trả về số lượng unread"),
            @ApiResponse(responseCode = "400", description = "Thiếu định danh user")
    })
    public ResponseEntity<Long> getUnreadCount(
            Authentication auth,
            @RequestHeader(value = "X-User-Id", required = false) String headerId) {
        
        String userId = getUserId(auth, headerId);
        if (userId == null) return ResponseEntity.badRequest().build();
        
        return ResponseEntity.ok(service.getUnreadCount(userId));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Đánh dấu một thông báo đã đọc")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đánh dấu thành công"),
            @ApiResponse(responseCode = "401", description = "Thiếu định danh user"),
            @ApiResponse(responseCode = "404", description = "Notification không tồn tại")
    })
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
    @Operation(summary = "Đánh dấu tất cả thông báo đã đọc")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đánh dấu thành công"),
            @ApiResponse(responseCode = "401", description = "Thiếu định danh user")
    })
    public ResponseEntity<Void> markAllAsRead(
            Authentication auth,
            @RequestHeader(value = "X-User-Id", required = false) String headerId) {
        
        String userId = getUserId(auth, headerId);
        if (userId == null) return ResponseEntity.status(401).build();
        
        service.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa thông báo theo ID")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Xóa thành công"),
            @ApiResponse(responseCode = "401", description = "Thiếu định danh user"),
            @ApiResponse(responseCode = "404", description = "Notification không tồn tại")
    })
    public ResponseEntity<Void> delete(
            Authentication auth, 
            @RequestHeader(value = "X-User-Id", required = false) String headerId,
            @PathVariable Long id) {
        
        String userId = getUserId(auth, headerId);
        if (userId == null) return ResponseEntity.status(401).build();
        
        service.deleteNotification(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'SHIPPING_MANAGER', 'SHIPPER')")
    @Operation(summary = "Gửi FCM tới user (theo device tokens)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đã gửi / hàng đợi gửi FCM"),
            @ApiResponse(responseCode = "403", description = "Không đủ quyền")
    })
    public ResponseEntity<Void> sendPush(@Valid @RequestBody SendPushRequest req) {
        notificationDispatcher.notifyUser(
                req.userId(),
                req.title(),
                req.body(),
                req.data() != null ? req.data() : Map.of());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin broadcast thông báo tới role mục tiêu")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Broadcast được xử lý"),
            @ApiResponse(responseCode = "403", description = "Không có quyền admin")
    })
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