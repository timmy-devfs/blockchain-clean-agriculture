package com.bicap.identity_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    @Schema(description = "Danh sách phần tử của trang hiện tại")
    private List<T> content;
    @Schema(description = "Chỉ số trang (bắt đầu từ 0)", example = "0")
    private int     page;
    @Schema(description = "Kích thước trang", example = "20")
    private int     size;
    @Schema(description = "Tổng số phần tử", example = "150")
    private long    totalElements;
    @Schema(description = "Tổng số trang", example = "8")
    private int     totalPages;
    @Schema(description = "Đây có phải trang cuối không", example = "false")
    private boolean last;
}