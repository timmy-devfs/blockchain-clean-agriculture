import { NextFunction, Request, Response, Router } from "express";
import { proxyShipments } from "../services/shipment.service";

const shipmentRouter = Router();

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

shipmentRouter.get("/api/farm/shipments", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const data = await proxyShipments(req.query as Record<string, unknown>, {
      userId: req.user?.userId,
      userRole: req.user?.userRole
    });
    return res.json(data);
  } catch (error) {
    const e = error as Error & { status?: number };
    return res.status(e.status ?? 502).json({
      message: e.message
    });
  }
}));

export { shipmentRouter };
