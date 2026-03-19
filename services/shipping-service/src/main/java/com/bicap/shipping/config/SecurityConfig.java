package com.bicap.shipping.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// Cấu hình bảo mật: không dùng session, không dùng login form
// Thay vào đó đọc X-User-Id và X-User-Role từ header do Gateway truyền vào
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final GatewayHeaderFilter gatewayHeaderFilter;

    public SecurityConfig(GatewayHeaderFilter gatewayHeaderFilter) {
        this.gatewayHeaderFilter = gatewayHeaderFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Tắt CSRF vì đây là REST API, không dùng form HTML
            .csrf(csrf -> csrf.disable())

            // Không lưu session, mỗi request tự xác thực lại
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Quy tắc phân quyền
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health").permitAll()  // Ai cũng gọi được
                .anyRequest().authenticated()                      // Còn lại phải xác thực
            )

            // Thêm filter đọc header từ Gateway trước khi Spring Security xử lý
            .addFilterBefore(gatewayHeaderFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
