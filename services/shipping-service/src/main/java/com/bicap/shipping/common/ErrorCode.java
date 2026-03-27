package com.bicap.shipping.common;

import lombok.Getter;

// Tập hợp các mã lỗi của shipping-service, bắt đầu bằng 4xxx
@Getter
public enum ErrorCode {

    // Lỗi chung
    UNAUTHORIZED(4001, "Bạn không có quyền thực hiện thao tác này"),
    FORBIDDEN(4003, "Truy cập bị từ chối"),
    NOT_FOUND(4004, "Không tìm thấy dữ liệu"),
    BAD_REQUEST(4000, "Yêu cầu không hợp lệ"),

    // Lỗi liên quan đến chuyến hàng
    SHIPMENT_NOT_FOUND(4010, "Không tìm thấy chuyến hàng"),
    SHIPMENT_ALREADY_CANCELLED(4011, "Chuyến hàng đã bị huỷ"),
    INVALID_STATUS_TRANSITION(4012, "Không thể chuyển sang trạng thái này"),

    // Lỗi liên quan đến tài xế
    DRIVER_NOT_FOUND(4020, "Không tìm thấy tài xế"),
    DRIVER_NOT_ACTIVE(4021, "Tài xế không còn hoạt động"),

    // Lỗi liên quan đến xe
    VEHICLE_NOT_FOUND(4030, "Không tìm thấy xe"),
    VEHICLE_NOT_ACTIVE(4031, "Xe không còn hoạt động");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
