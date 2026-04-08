import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { AppError } from "../errors/appError";

export function jwtMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next(new AppError("UNAUTHORIZED"));
    return;
  }

  const token = authHeader.slice(7);
  if (token !== env.JWT_SECRET) {
    next(new AppError("UNAUTHORIZED"));
    return;
  }

  next();
}
