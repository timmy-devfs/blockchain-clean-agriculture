import { NextFunction, Request, Response, Router } from "express";
import { mapListingToResponse, mapSubscriptionToResponse } from "../mappers/marketplace.mapper";
import {
  createListingSchema,
  listMyListingsQuerySchema,
  myPackageQuerySchema,
  subscribePackageSchema,
  updateListingSchema
} from "../schemas/marketplace.schema";
import {
  createListing,
  deleteListing,
  getAvailablePackages,
  getPublicFarmProfile,
  getPublicListingById,
  getPublicListings,
  getMyCurrentPackage,
  getMyListings,
  subscribePackage,
  updateListing
} from "../services/marketplace.service";

const marketplaceRouter = Router();

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

marketplaceRouter.post("/api/farm/marketplace/listings", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = createListingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const result = await createListing(userId, parsed.data);
  switch (result.type) {
    case "FARM_NOT_FOUND":
      return res.status(404).json({ message: "Farm not found" });
    case "SEASON_NOT_FOUND":
      return res.status(404).json({ message: "Season not found in farm" });
    case "FORBIDDEN":
      if (result.reason === "FARM_NOT_APPROVED") {
        return res.status(403).json({ message: "Farm is not approved" });
      }
      return res.status(403).json({ message: "Service package is expired or not found" });
    case "CREATED":
      return res.status(201).json(mapListingToResponse(result.listing));
  }
}));

marketplaceRouter.get("/api/farm/marketplace/listings", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = listMyListingsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", errors: parsed.error.flatten() });
  }

  const listings = await getMyListings(userId, parsed.data);
  return res.json(listings);
}));

marketplaceRouter.get("/api/farm/marketplace/products", asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 0);
  const size = Number(req.query.size ?? 20);
  const keyword = typeof req.query.keyword === "string" ? req.query.keyword : undefined;
  const farmId = typeof req.query.farmId === "string" ? req.query.farmId : undefined;
  const seasonId = typeof req.query.seasonId === "string" ? req.query.seasonId : undefined;

  const data = await getPublicListings({
    page: Number.isFinite(page) && page >= 0 ? page : 0,
    size: Number.isFinite(size) && size > 0 ? size : 20,
    keyword,
    farmId,
    seasonId
  });

  return res.json(data);
}));

marketplaceRouter.get("/api/farm/marketplace/products/:id", asyncHandler(async (req, res) => {
  const item = await getPublicListingById(req.params.id);
  if (!item) {
    return res.status(404).json({ message: "Product not found" });
  }

  return res.json(item);
}));

marketplaceRouter.get("/api/farm/marketplace/farms/:farmId", asyncHandler(async (req, res) => {
  const farm = await getPublicFarmProfile(req.params.farmId);
  if (!farm) {
    return res.status(404).json({ message: "Farm not found" });
  }

  return res.json(farm);
}));

marketplaceRouter.get("/api/farm/marketplace/listings/my", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = listMyListingsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", errors: parsed.error.flatten() });
  }

  const listings = await getMyListings(userId, parsed.data);
  return res.json(listings);
}));

marketplaceRouter.put("/api/farm/marketplace/listings/:id", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = updateListingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const listing = await updateListing(userId, req.params.id, parsed.data);
  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  return res.json(mapListingToResponse(listing));
}));

marketplaceRouter.delete("/api/farm/marketplace/listings/:id", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const deleted = await deleteListing(userId, req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Listing not found" });
  }

  return res.status(204).send();
}));

marketplaceRouter.get("/api/farm/packages", asyncHandler(async (_req, res) => {
  return res.json(getAvailablePackages());
}));

marketplaceRouter.post("/api/farm/packages/:id/subscribe", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = subscribePackageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const result = await subscribePackage(userId, req.params.id, parsed.data);

  if (result.type === "FARM_NOT_FOUND") {
    return res.status(404).json({ message: "Farm not found" });
  }

  if (result.type === "FARM_NOT_APPROVED") {
    return res.status(403).json({ message: "Farm is not approved" });
  }

  if (result.type === "PACKAGE_NOT_FOUND") {
    return res.status(404).json({ message: "Package not found" });
  }

  return res.status(201).json({
    paymentUrl: result.paymentUrl,
    subscription: mapSubscriptionToResponse(result.subscription)
  });
}));

marketplaceRouter.get("/api/farm/packages/my", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = myPackageQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", errors: parsed.error.flatten() });
  }

  const result = await getMyCurrentPackage(userId, parsed.data.farmId);

  if (result.type === "FARM_NOT_FOUND") {
    return res.status(404).json({ message: "Farm not found" });
  }

  if (result.type === "NO_ACTIVE_PACKAGE") {
    return res.json({
      subscription: null,
      expiryDate: null,
      countdownSeconds: null
    });
  }

  return res.json({
    subscription: mapSubscriptionToResponse(result.subscription),
    expiryDate: result.expiryDate,
    countdownSeconds: result.countdownSeconds
  });
}));

export { marketplaceRouter };
