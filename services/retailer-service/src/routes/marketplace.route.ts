import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import { AppError } from "../errors/appError";
import { marketplaceService } from "../services/marketplace.service";
import { retailOrderService } from "../services/retailOrder.service";

export const marketplaceRouter = Router();

marketplaceRouter.get("/marketplace/products", async (req, res, next) => {
  try {
    const data = await marketplaceService.searchProducts(req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

marketplaceRouter.get("/marketplace/products/:id", async (req, res, next) => {
  try {
    const data = await marketplaceService.getProductDetail(req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

marketplaceRouter.get("/marketplace/farms/:farmId", async (req, res, next) => {
  try {
    const data = await marketplaceService.getFarmProfile(req.params.farmId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/** Public: shipping-service tra tên retailer theo id (Mongo). */
marketplaceRouter.get("/marketplace/retailers/:retailerId", async (req, res, next) => {
  try {
    const r = await retailOrderService.findPublicRetailerById(req.params.retailerId);
    if (!r) {
      res.status(404).json({ message: "Retailer not found" });
      return;
    }
    res.json({
      id: r.id,
      name: r.name,
      phone: r.phone ?? null,
      address: r.address ?? null
    });
  } catch (error) {
    next(error);
  }
});

marketplaceRouter.use((error: unknown, _req: Request, _res: Response, next: NextFunction) => {
  if (error instanceof z.ZodError) {
    next(new AppError("INVALID_REQUEST", error.issues.map((i) => i.message).join("; ")));
    return;
  }

  next(error);
});
