import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/appError";

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof AppError) {
    res.status(error.status).json({
      code: error.code,
      message: error.message
    });
    return;
  }

  res.status(500).json({
    code: 3999,
    message: "Internal server error"
  });
}
