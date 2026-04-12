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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/tokens", "/api/notify/tokens"})
public class TokenController {

    private final DeviceTokenService deviceTokenService;

    public TokenController(DeviceTokenService deviceTokenService) {
        this.deviceTokenService = deviceTokenService;
    }

    @PostMapping
    public ResponseEntity<Void> registerToken(Authentication authentication,
                                              @Valid @RequestBody TokenUpsertRequest request) {
        deviceTokenService.registerToken(authentication.getName(), request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{token}")
    public ResponseEntity<Void> removeToken(Authentication authentication,
                                            @PathVariable String token) {
        deviceTokenService.deleteToken(authentication.getName(), token);
        return ResponseEntity.noContent().build();
    }
}

