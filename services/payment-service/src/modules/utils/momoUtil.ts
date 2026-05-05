import { env } from "../../config/env";
import { signHmacSha256 } from "./hmac";

type BuildMomoUrlInput = {
  paymentId: string;
  orderId: string;
  amount: number;
  returnUrl?: string;
};

const stringifyParams = (params: Record<string, string>): string =>
  Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

export const buildMomoPaymentUrl = (input: BuildMomoUrlInput): string => {
  const params: Record<string, string> = {
    partnerCode: env.MOMO_PARTNER_CODE,
    accessKey: env.MOMO_ACCESS_KEY,
    requestId: input.paymentId,
    amount: String(Math.round(input.amount)),
    orderId: input.orderId,
    orderInfo: `order-${input.orderId}`,
    redirectUrl: input.returnUrl ?? env.MOMO_RETURN_URL,
    ipnUrl: input.returnUrl ?? env.MOMO_RETURN_URL,
    requestType: "captureWallet",
    extraData: "",
    type: "DEPOSIT",
    paymentId: input.paymentId
  };

  const raw = stringifyParams(params);
  const signature = signHmacSha256(raw, env.MOMO_SECRET_KEY);
  const encoded = Object.keys(params)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");

  return `${env.MOMO_ENDPOINT}?${encoded}&signature=${signature}`;
};

export const verifyMomoCallback = (payload: Record<string, string>, signature: string): boolean => {
  const signedPayload = { ...payload };
  delete signedPayload.signature;
  const raw = stringifyParams(signedPayload);
  const expected = signHmacSha256(raw, env.MOMO_SECRET_KEY);
  return expected === signature;
};
