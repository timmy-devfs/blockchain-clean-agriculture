import { ErrorCodeKey, errorCodes } from "./errorCodes";

export class AppError extends Error {
  readonly code: number;
  readonly status: number;

  constructor(key: ErrorCodeKey, details?: string) {
    const cfg = errorCodes[key];
    const message = details ? `${cfg.message}: ${details}` : cfg.message;
    super(message);
    this.name = "AppError";
    this.code = cfg.code;
    this.status = cfg.status;
  }
}
