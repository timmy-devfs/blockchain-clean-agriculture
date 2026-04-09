package com.bicap.report.common;

import lombok.Getter;

@Getter
public enum ErrorCode {
    UNAUTHORIZED(4001, "Bạn không có quyền thực hiện thao tác này"),
    FORBIDDEN(4003, "Truy cập bị từ chối"),
    NOT_FOUND(4004, "Không tìm thấy dữ liệu"),
    BAD_REQUEST(4000, "Yêu cầu không hợp lệ"),
    REPORT_NOT_FOUND(4201, "Không tìm thấy báo cáo");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
