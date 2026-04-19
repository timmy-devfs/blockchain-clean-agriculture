import { env } from "../../config/env";
import { signHmacSha512 } from "./hmac";

type BuildVNPayUrlInput = {
  paymentId: string;
  orderId: string;
  amount: number;
  returnUrl?: string;
};

const stringifyParams = (params: Record<string, string>): string =>
  Object.keys(params)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");

export const buildVNPayPaymentUrl = (input: BuildVNPayUrlInput): string => {
  const params: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: env.VNPAY_TMN_CODE,
    vnp_TxnRef: input.paymentId,
    vnp_OrderInfo: `order-${input.orderId}`,
    vnp_OrderType: "other",
    vnp_Amount: String(Math.round(input.amount * 100)),
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_ReturnUrl: input.returnUrl ?? env.VNPAY_RETURN_URL,
    vnp_CreateDate: new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14),
    orderId: input.orderId,
    amount: String(input.amount),
    type: "DEPOSIT"
  };

  const query = stringifyParams(params);
  const signature = signHmacSha512(query, env.VNPAY_HASH_SECRET);
  return `${env.VNPAY_URL}?${query}&vnp_SecureHash=${signature}`;
};

export const verifyVNPayCallback = (payload: Record<string, string>, signature: string): boolean => {
  const signedPayload = { ...payload };
  delete signedPayload.signature;
  const query = stringifyParams(signedPayload);
  const expected = signHmacSha512(query, env.VNPAY_HASH_SECRET);
  return expected === signature;
};
