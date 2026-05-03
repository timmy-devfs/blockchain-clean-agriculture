package com.bicap.identity_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BootstrapStatusResponse {

    @Schema(description = "True khi chưa có user nào trong DB — cho phép trang /setup seed demo")
    private boolean systemEmpty;
}
