import { NextFunction, Request, Response, Router } from "express";
import { mapOrderToResponse } from "../mappers/order.mapper";
import { listOrdersQuerySchema, rejectOrderSchema } from "../schemas/order.schema";
import { confirmOrder, getMyOrders, rejectOrder } from "../services/order.service";

const orderRouter = Router();

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

orderRouter.get("/api/farm/orders", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = listOrdersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", errors: parsed.error.flatten() });
  }

  const orders = await getMyOrders(userId, parsed.data);
  return res.json(orders);
}));

orderRouter.put("/api/farm/orders/:id/confirm", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const result = await confirmOrder(userId, req.params.id);
  if (result.type === "NOT_FOUND") {
    return res.status(404).json({ message: "Order not found" });
  }

  if (result.type === "INVALID_STATUS") {
    return res.status(400).json({
      errorCode: result.errorCode,
      message: result.message,
      currentStatus: result.currentStatus
    });
  }

  return res.json(mapOrderToResponse(result.order));
}));

orderRouter.put("/api/farm/orders/:id/reject", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = rejectOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const result = await rejectOrder(userId, req.params.id, parsed.data.rejectReason);
  if (result.type === "NOT_FOUND") {
    return res.status(404).json({ message: "Order not found" });
  }

  if (result.type === "INVALID_STATUS") {
    return res.status(400).json({
      errorCode: result.errorCode,
      message: result.message,
      currentStatus: result.currentStatus
    });
  }

  return res.json(mapOrderToResponse(result.order));
}));

export { orderRouter };
