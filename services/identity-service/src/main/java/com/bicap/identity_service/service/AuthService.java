package com.bicap.identity_service.service;

import com.bicap.identity_service.dto.request.*;
import com.bicap.identity_service.dto.response.*;

public interface AuthService {
    UserResponse    register(RegisterRequest request);
    TokenResponse   login(LoginRequest request);
    TokenResponse   refreshToken(RefreshTokenRequest request);
    IntrospectResponse introspect(IntrospectRequest request);
}