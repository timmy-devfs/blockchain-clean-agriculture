import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import { AppError } from "../../errors/appError";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { callbackSchema, createPaymentSchema, historyQuerySchema, refundSchema } from "../schemas/payment.schema";
import { paymentService } from "../services/payment.service";

export const paymentRouter = Router();

paymentRouter.post("/api/pay/payments", authMiddleware, async (req, res, next) => {
  try {
    const payload = createPaymentSchema.parse(req.body);
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError("UNAUTHORIZED");
    }
    const data = await paymentService.createPayment(userId, payload);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

paymentRouter.post("/api/pay/payments/callback", async (req, res, next) => {
  try {
    const payload = callbackSchema.parse(req.body);
    const data = await paymentService.handleCallback(payload);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

paymentRouter.get("/api/pay/payments/history", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError("UNAUTHORIZED");
    }
    const query = historyQuerySchema.parse(req.query);
    const data = await paymentService.getHistory(userId, query);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

paymentRouter.post("/api/pay/payments/:id/refund", authMiddleware, async (req, res, next) => {
  try {
    if ((req.user?.userRole ?? "").toUpperCase() !== "ADMIN") {
      throw new AppError("FORBIDDEN");
    }
    const paymentId = z.string().trim().min(1).parse(req.params.id);
    const payload = refundSchema.parse(req.body ?? {});
    const data = await paymentService.refundByAdmin(paymentId, payload.reason);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

paymentRouter.use((error: unknown, _req: Request, _res: Response, next: NextFunction) => {
  if (error instanceof z.ZodError) {
    next(new AppError("INVALID_REQUEST", error.issues.map((item) => item.message).join("; ")));
    return;
  }
  next(error);
});
