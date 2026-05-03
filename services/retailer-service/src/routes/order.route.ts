import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import { AppError } from "../errors/appError";
import { jwtMiddleware } from "../middlewares/jwtMiddleware";
import { orderService } from "../services/order.service";
import { OrderStatus } from "../constants/orderStatus";

const paymentCallbackSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().optional(),
  transactionId: z.string().optional(),
  amount: z.number().positive().optional()
});

export const orderRouter = Router();

function hasAdminRole(roleHeader: unknown): boolean {
  if (typeof roleHeader !== "string") return false;
  const normalized = roleHeader.trim().toUpperCase();
  return normalized === "ADMIN" || normalized === "ROLE_ADMIN";
}

/** Cho Shipping Manager / Driver app demo đọc đơn CONFIRMED across retailers (không lọc x-user-id). */
function hasShippingAccess(roleHeader: unknown): boolean {
  if (typeof roleHeader !== "string") return false;
  const r = roleHeader.trim().toUpperCase();
  return (
    r === "ADMIN" ||
    r === "ROLE_ADMIN" ||
    r === "SHIPPING_MANAGER" ||
    r === "SHIPPER" ||
    r === "ROLE_SHIPPER" ||
    r === "SHIP_DRIVER"
  );
}

orderRouter.post("/orders", jwtMiddleware, async (req, res, next) => {
  try {
    const result = await orderService.createOrder(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

orderRouter.post("/orders/payment-callback", async (req, res, next) => {
  try {
    const payload = paymentCallbackSchema.parse(req.body);
    const order = await orderService.handlePaymentCallback(payload);
    res.json(order);
  } catch (error) {
    next(error);
  }
});

orderRouter.get("/orders", jwtMiddleware, async (req, res, next) => {
  try {
    const retailerId =
      typeof req.headers["x-user-id"] === "string" && req.headers["x-user-id"].trim().length > 0
        ? req.headers["x-user-id"].trim()
        : undefined;
    const orders = await orderService.listOrders(req.query, retailerId);
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

orderRouter.get("/admin/orders", jwtMiddleware, async (req, res, next) => {
  try {
    if (!hasAdminRole(req.headers["x-user-role"])) {
      next(new AppError("FORBIDDEN"));
      return;
    }
    const orders = await orderService.listOrders(req.query);
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

/** Đơn hàng CONFIRMED — dùng từ shipping-service + web shipping dashboard. */
orderRouter.get("/shipping/confirmed-orders", jwtMiddleware, async (req, res, next) => {
  try {
    if (!hasShippingAccess(req.headers["x-user-role"])) {
      next(new AppError("FORBIDDEN"));
      return;
    }
    const orders = await orderService.listOrders({ status: OrderStatus.CONFIRMED });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

orderRouter.get("/orders/:orderId", jwtMiddleware, async (req, res, next) => {
  try {
    const data = await orderService.getOrderById(req.params.orderId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

orderRouter.delete("/orders/:orderId/cancel", jwtMiddleware, async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(req.params.orderId);
    res.json(order);
  } catch (error) {
    next(error);
  }
});

orderRouter.use((error: unknown, _req: Request, _res: Response, next: NextFunction) => {
  if (error instanceof z.ZodError) {
    next(new AppError("INVALID_REQUEST", error.issues.map((i) => i.message).join("; ")));
    return;
  }

  next(error);
});
