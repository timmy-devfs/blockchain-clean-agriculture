export const errorCodes = {
  UNAUTHORIZED: { code: 5001, message: "Unauthorized", status: 401 },
  FORBIDDEN: { code: 5002, message: "Forbidden", status: 403 },
  INVALID_REQUEST: { code: 5003, message: "Invalid request payload", status: 400 },
  PAYMENT_NOT_FOUND: { code: 5004, message: "Payment not found", status: 404 },
  INVALID_SIGNATURE: { code: 5005, message: "INVALID_SIGNATURE", status: 400 },
  INVALID_PAYMENT_STATUS: { code: 5006, message: "Invalid payment status", status: 400 }
} as const;

export type ErrorCodeKey = keyof typeof errorCodes;
