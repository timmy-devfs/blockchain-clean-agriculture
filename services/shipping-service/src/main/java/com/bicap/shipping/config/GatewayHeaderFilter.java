package com.bicap.shipping.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

// Filter này chạy 1 lần cho mỗi request
// Nhiệm vụ: đọc header X-User-Id và X-User-Role mà API Gateway gắn vào
// rồi tạo thông tin xác thực để Spring Security nhận biết người dùng
@Component
public class GatewayHeaderFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Đọc 2 header do Gateway truyền vào
        String userId = request.getHeader("X-User-Id");
        String userRole = request.getHeader("X-User-Role");

        // Nếu có đủ thông tin thì tạo xác thực
        if (userId != null && userRole != null) {
            var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + userRole));
            var auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        // Tiếp tục xử lý request
        filterChain.doFilter(request, response);
    }
}
