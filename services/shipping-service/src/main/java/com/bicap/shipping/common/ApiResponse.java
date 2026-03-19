package com.bicap.shipping.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// Định dạng chuẩn cho mọi response trả về từ API
// Ví dụ thành công: { "code": 200, "message": "OK", "data": {...} }
// Ví dụ lỗi:       { "code": 4001, "message": "Không tìm thấy chuyến hàng", "data": null }
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    private int code;       // Mã kết quả
    private String message; // Thông báo
    private T data;         // Dữ liệu trả về (có thể null nếu lỗi)

    // Tạo nhanh response thành công
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .code(200)
                .message("Success")
                .data(data)
                .build();
    }

    // Tạo nhanh response lỗi
    public static <T> ApiResponse<T> error(ErrorCode errorCode) {
        return ApiResponse.<T>builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .data(null)
                .build();
    }
}
