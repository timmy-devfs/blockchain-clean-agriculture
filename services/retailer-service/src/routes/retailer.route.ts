import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import { OrderStatus } from "../constants/orderStatus";
import { retailOrderService } from "../services/retailOrder.service";
import { jwtMiddleware } from "../middlewares/jwtMiddleware";
import { AppError } from "../errors/appError";

const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  changedBy: z.string().optional(),
  note: z.string().optional()
});

const scanQrSchema = z.object({
  qrCode: z.string().min(1)
});

const confirmDeliverySchema = z.object({
  changedBy: z.string().optional()
});

export const retailerRouter = Router();

retailerRouter.get("/retailers/search", jwtMiddleware, async (req, res, next) => {
  try {
    const keyword = typeof req.query.keyword === "string" ? req.query.keyword : undefined;
    const retailers = await retailOrderService.searchRetailers(keyword);
    res.json(retailers);
  } catch (error) {
    next(error);
  }
});

retailerRouter.post("/retailers", jwtMiddleware, async (req, res, next) => {
  try {
    const retailer = await retailOrderService.createRetailer(req.body);
    res.status(201).json(retailer);
  } catch (error) {
    next(error);
  }
});

retailerRouter.post("/orders", jwtMiddleware, async (req, res, next) => {
  try {
    const order = await retailOrderService.createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

retailerRouter.patch("/orders/:orderId/status", jwtMiddleware, async (req, res, next) => {
  try {
    const payload = updateStatusSchema.parse(req.body);
    const order = await retailOrderService.updateOrderStatus(
      req.params.orderId,
      payload.status,
      payload.changedBy,
      payload.note
    );
    res.json(order);
  } catch (error) {
    next(error);
  }
});

retailerRouter.post("/orders/:orderId/qr-scan", jwtMiddleware, async (req, res, next) => {
  try {
    const payload = scanQrSchema.parse(req.body);
    const order = await retailOrderService.scanOrderQr(req.params.orderId, payload.qrCode);
    res.json(order);
  } catch (error) {
    next(error);
  }
});

retailerRouter.post("/orders/:orderId/confirm-delivery", jwtMiddleware, async (req, res, next) => {
  try {
    const payload = confirmDeliverySchema.parse(req.body);
    const order = await retailOrderService.confirmDelivery(req.params.orderId, payload.changedBy);
    res.json(order);
  } catch (error) {
    next(error);
  }
});

retailerRouter.use((error: unknown, _req: Request, _res: Response, next: NextFunction) => {
  if (error instanceof z.ZodError) {
    next(new AppError("INVALID_REQUEST", error.issues.map((i) => i.message).join("; ")));
    return;
  }

  next(error);
});
