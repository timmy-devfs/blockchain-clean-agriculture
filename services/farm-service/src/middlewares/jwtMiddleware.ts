import { NextFunction, Request, Response } from "express";

export const jwtMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const userId = req.header("X-User-Id");
  const userRole = req.header("X-User-Role");

  req.user = {
    userId: userId ?? undefined,
    userRole: userRole ?? undefined
  };

  next();
};