import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import { mapFarmToResponse } from "../mappers/farm.mapper";
import {
  adminFarmStatusQuerySchema,
  adminRejectSchema,
  createFarmSchema,
  updateFarmSchema,
  uploadLicenseSchema
} from "../schemas/farm.schema";
import {
  adminApproveFarm,
  adminDeleteFarm,
  getAdminFarmDetail,
  adminRejectFarm,
  adminUpdateFarm,
  createFarm,
  getAdminFarms,
  getMyFarms,
  updateMyFarm,
  upsertFarmLicense
} from "../services/farm.service";

const upload = multer({ storage: multer.memoryStorage() });

const isAdmin = (role?: string): boolean => role?.toUpperCase() === "ADMIN";
const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

const farmRouter = Router();

farmRouter.post("/api/farm/farms", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = createFarmSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const farm = await createFarm(userId, parsed.data);
  return res.status(201).json(mapFarmToResponse(farm));
}));

farmRouter.get("/api/farm/farms", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const farms = await getMyFarms(userId);
  return res.json(farms.map(mapFarmToResponse));
}));

farmRouter.put("/api/farm/farms/:id", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = updateFarmSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const updated = await updateMyFarm(req.params.id, userId, parsed.data);
  if (!updated) {
    return res.status(404).json({ message: "Farm not found" });
  }

  return res.json(mapFarmToResponse(updated));
}));

farmRouter.post("/api/farm/farms/:id/license", upload.single("file"), asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = uploadLicenseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  try {
    const farm = await upsertFarmLicense(req.params.id, userId, parsed.data);
    if (!farm) {
      return res.status(404).json({ message: "Farm not found" });
    }
    return res.status(201).json(mapFarmToResponse(farm));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ message: "Business license number already exists" });
    }
    throw error;
  }
}));

farmRouter.get("/api/farm/admin/farms", asyncHandler(async (req, res) => {
  if (!isAdmin(req.user?.userRole)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const parsed = adminFarmStatusQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", errors: parsed.error.flatten() });
  }

  const farms = await getAdminFarms(parsed.data.status);
  return res.json(farms.map(mapFarmToResponse));
}));

farmRouter.get("/api/farm/admin/farms/:id", asyncHandler(async (req, res) => {
  if (!isAdmin(req.user?.userRole)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const farm = await getAdminFarmDetail(req.params.id);
  if (!farm) {
    return res.status(404).json({ message: "Farm not found" });
  }

  return res.json(mapFarmToResponse(farm));
}));

farmRouter.put("/api/farm/admin/farms/:id", asyncHandler(async (req, res) => {
  if (!isAdmin(req.user?.userRole)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const parsed = updateFarmSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const updated = await adminUpdateFarm(req.params.id, parsed.data);
  if (!updated) {
    return res.status(404).json({ message: "Farm not found" });
  }

  return res.json(mapFarmToResponse(updated));
}));

farmRouter.delete("/api/farm/admin/farms/:id", asyncHandler(async (req, res) => {
  if (!isAdmin(req.user?.userRole)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const deleted = await adminDeleteFarm(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Farm not found" });
  }

  return res.status(204).send();
}));

farmRouter.put("/api/farm/admin/farms/:id/approve", asyncHandler(async (req, res) => {
  if (!isAdmin(req.user?.userRole)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const approvedFarm = await adminApproveFarm(req.params.id);
  if (!approvedFarm) {
    return res.status(404).json({ message: "Farm not found" });
  }

  return res.json(mapFarmToResponse(approvedFarm));
}));

farmRouter.put("/api/farm/admin/farms/:id/reject", asyncHandler(async (req, res) => {
  if (!isAdmin(req.user?.userRole)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const parsed = adminRejectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const rejectedFarm = await adminRejectFarm(req.params.id, parsed.data.rejectReason);
  if (!rejectedFarm) {
    return res.status(404).json({ message: "Farm not found" });
  }

  return res.json(mapFarmToResponse(rejectedFarm));
}));

export { farmRouter };
