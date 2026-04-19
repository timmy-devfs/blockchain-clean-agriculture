export const errorCodes = {
  RETAILER_NOT_FOUND: { code: 3001, message: "Retailer not found", status: 404 },
  ORDER_NOT_FOUND: { code: 3002, message: "Order not found", status: 404 },
  INVALID_ORDER_STATUS_FLOW: { code: 3003, message: "Invalid order status transition", status: 400 },
  UNAUTHORIZED: { code: 3004, message: "Unauthorized", status: 401 },
  QR_SCAN_FAILED: { code: 3005, message: "QR scan failed", status: 422 },
  DOWNSTREAM_SERVICE_ERROR: { code: 3006, message: "Downstream service error", status: 502 },
  INVALID_REQUEST: { code: 3007, message: "Invalid request payload", status: 400 },
  DELIVERY_CONFIRMATION_FAILED: { code: 3008, message: "Delivery confirmation failed", status: 409 },
  PRODUCT_NOT_FOUND: { code: 3009, message: "Product not found", status: 404 },
  FARM_NOT_FOUND: { code: 3010, message: "Farm not found", status: 404 },
  MARKETPLACE_UNAVAILABLE: { code: 3011, message: "Marketplace service unavailable", status: 503 },
  PAYMENT_SERVICE_ERROR: { code: 3012, message: "Payment service error", status: 502 },
  ORDER_CANCELLATION_NOT_ALLOWED: { code: 3013, message: "Order cancellation is not allowed", status: 400 },
  INVALID_EVENT_PAYLOAD: { code: 3014, message: "Invalid event payload", status: 400 },
  QR_NOT_FOUND: { code: 3015, message: "QR not found", status: 404 },
  PROFILE_NOT_FOUND: { code: 3016, message: "Retailer profile not found", status: 404 }
} as const;

export type ErrorCodeKey = keyof typeof errorCodes;
