import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import { z } from "zod";
import { AppError } from "../errors/appError";
import { jwtMiddleware } from "../middlewares/jwtMiddleware";
import { retailFlowService } from "../services/retailFlow.service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 10,
    fileSize: 10 * 1024 * 1024
  }
});

const qrScanSchema = z.object({
  qrCode: z.string().min(1)
});

const profileQuerySchema = z.object({
  retailerId: z.string().min(1)
});

const updateProfileSchema = z.object({
  retailerId: z.string().min(1),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional()
});

const uploadLicenseSchema = z.object({
  retailerId: z.string().min(1),
  licenseNumber: z.string().min(1),
  issuedBy: z.string().optional(),
  issuedAt: z.string().optional(),
  expiresAt: z.string().optional()
});

const createReportSchema = z.object({
  retailerId: z.string().min(1),
  type: z.string().min(1),
  content: z.string().min(1),
  targetId: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const retailFlowRouter = Router();

retailFlowRouter.post("/qr/scan", jwtMiddleware, async (req, res, next) => {
  try {
    const payload = qrScanSchema.parse(req.body);
    const data = await retailFlowService.scanQr(payload.qrCode);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

retailFlowRouter.post(
  "/orders/:orderId/confirm-delivery",
  jwtMiddleware,
  upload.array("deliveryProofs"),
  async (req, res, next) => {
    try {
      const orderId = z.string().min(1).parse(req.params.orderId);
      const recipientNote = typeof req.body.recipientNote === "string" ? req.body.recipientNote : undefined;
      const files = Array.isArray(req.files) ? req.files : [];
      const data = await retailFlowService.confirmDelivery(orderId, recipientNote, files);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
);

retailFlowRouter.get("/orders/:orderId/shipping", jwtMiddleware, async (req, res, next) => {
  try {
    const orderId = z.string().min(1).parse(req.params.orderId);
    const data = await retailFlowService.getShipping(orderId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

retailFlowRouter.get("/profile", jwtMiddleware, async (req, res, next) => {
  try {
    const query = profileQuerySchema.parse(req.query);
    const profile = await retailFlowService.getProfile(query.retailerId);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

retailFlowRouter.put("/profile", jwtMiddleware, async (req, res, next) => {
  try {
    const payload = updateProfileSchema.parse(req.body);
    const profile = await retailFlowService.upsertProfile(payload.retailerId, {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      address: payload.address
    });
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

retailFlowRouter.post(
  "/profile/license",
  jwtMiddleware,
  upload.array("files"),
  async (req, res, next) => {
    try {
      const payload = uploadLicenseSchema.parse(req.body);
      const files = Array.isArray(req.files) ? req.files : [];
      const profile = await retailFlowService.uploadProfileLicense(
        payload.retailerId,
        {
          licenseNumber: payload.licenseNumber,
          issuedBy: payload.issuedBy,
          issuedAt: payload.issuedAt,
          expiresAt: payload.expiresAt
        },
        files
      );
      res.status(201).json(profile);
    } catch (error) {
      next(error);
    }
  }
);

retailFlowRouter.post("/reports", jwtMiddleware, async (req, res, next) => {
  try {
    const payload = createReportSchema.parse(req.body);
    const data = await retailFlowService.createReport(payload);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

retailFlowRouter.use((error: unknown, _req: Request, _res: Response, next: NextFunction) => {
  if (error instanceof z.ZodError) {
    next(new AppError("INVALID_REQUEST", error.issues.map((item) => item.message).join("; ")));
    return;
  }
  next(error);
});
