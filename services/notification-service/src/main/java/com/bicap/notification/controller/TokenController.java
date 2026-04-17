package com.bicap.notification.controller;

import com.bicap.notification.dto.TokenUpsertRequest;
import com.bicap.notification.service.DeviceTokenService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/tokens", "/api/notify/tokens"})
public class TokenController {

    private final DeviceTokenService deviceTokenService;

    public TokenController(DeviceTokenService deviceTokenService) {
        this.deviceTokenService = deviceTokenService;
    }

    // @PostMapping
    // public ResponseEntity<Void> registerToken(Authentication authentication,
    //                                           @Valid @RequestBody TokenUpsertRequest request) {
    //     deviceTokenService.registerToken(authentication.getName(), request);
    //     return ResponseEntity.ok().build();
    // }

    // @DeleteMapping("/{token}")
    // public ResponseEntity<Void> removeToken(Authentication authentication,
    //                                         @PathVariable String token) {
    //     deviceTokenService.deleteToken(authentication.getName(), token);
    //     return ResponseEntity.noContent().build();
    // }

    @PostMapping
    public ResponseEntity<Void> registerToken(
            Authentication authentication,
            @RequestHeader(value = "X-User-Id", required = false) String headerId,
            @Valid @RequestBody TokenUpsertRequest request) {
        
        // Tránh lỗi NullPointerException khi test bằng curl
        String userId = (authentication != null) ? authentication.getName() : headerId;
        
        if (userId == null) {
            return ResponseEntity.status(401).build(); // Unauthorized nếu không có user id
        }

        deviceTokenService.registerToken(userId, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{token}")
    public ResponseEntity<Void> removeToken(
            Authentication authentication,
            @RequestHeader(value = "X-User-Id", required = false) String headerId,
            @PathVariable String token) {
        
        String userId = (authentication != null) ? authentication.getName() : headerId;
        
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        deviceTokenService.deleteToken(userId, token);
        return ResponseEntity.noContent().build();
    }
}

