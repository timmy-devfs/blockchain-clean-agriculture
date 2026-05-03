package com.bicap.shipping.util;

/**
 * Đồng bộ với retailer (Mongo UUID) và Kafka {@code OrderConfirmedListener}:
 * số thì giữ; chuỗi UUID → long xác định (hashCode).
 */
public final class OrderIdUtil {

    private OrderIdUtil() {
    }

    public static Long toNumericId(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(raw);
        } catch (NumberFormatException e) {
            return (long) Integer.toUnsignedLong(raw.hashCode());
        }
    }
}
