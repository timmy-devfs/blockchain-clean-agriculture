import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import { AppError } from "../errors/appError";
import { marketplaceService } from "../services/marketplace.service";

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

marketplaceRouter.use((error: unknown, _req: Request, _res: Response, next: NextFunction) => {
  if (error instanceof z.ZodError) {
    next(new AppError("INVALID_REQUEST", error.issues.map((i) => i.message).join("; ")));
    return;
  }

  next(error);
});
