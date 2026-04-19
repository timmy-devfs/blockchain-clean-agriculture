import crypto from "crypto";

export const signHmacSha512 = (payload: string, secret: string): string =>
  crypto.createHmac("sha512", secret).update(payload).digest("hex");

export const signHmacSha256 = (payload: string, secret: string): string =>
  crypto.createHmac("sha256", secret).update(payload).digest("hex");
