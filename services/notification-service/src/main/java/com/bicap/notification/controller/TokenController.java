package com.bicap.notification.controller;

import com.bicap.notification.dto.TokenUpsertRequest;
import com.bicap.notification.service.DeviceTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Device Tokens", description = "Manage FCM device tokens per user")
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
    @Operation(summary = "Đăng ký hoặc cập nhật device token")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lưu token thành công"),
            @ApiResponse(responseCode = "401", description = "Thiếu định danh người dùng"),
            @ApiResponse(responseCode = "400", description = "Payload không hợp lệ")
    })
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
    @Operation(summary = "Xóa device token theo giá trị token")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Xóa token thành công"),
            @ApiResponse(responseCode = "401", description = "Thiếu định danh người dùng")
    })
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

