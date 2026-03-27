package com.bicap.shipping.constant;

// Trạng thái của một chuyến hàng, đi theo thứ tự từ trên xuống
public enum ShipmentStatus {

    CREATED,        // Vừa tạo đơn hàng, chưa có tài xế
    ASSIGNED,       // Đã phân công tài xế và xe
    PICKED_UP,      // Tài xế đã đến lấy hàng
    IN_TRANSIT,     // Đang trên đường giao
    DELAYED,        // Bị trễ (thời tiết, kẹt xe...)
    DELIVERED,      // Giao thành công
    CANCELLED       // Đã huỷ

}
