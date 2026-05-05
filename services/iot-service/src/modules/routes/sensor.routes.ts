import { NextFunction, Request, Response, Router } from "express";
import {
  dashboardQuerySchema,
  historyQuerySchema,
  ingestSensorBatchSchema,
  latestQuerySchema
} from "../schemas/sensor.schema";
import { getDashboard, getHistory, getLatestByFarm, ingestSensorBatch } from "../services/sensor.service";

const sensorRouter = Router();

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

sensorRouter.post("/api/iot/sensors/data", asyncHandler(async (req, res) => {
  const parsed = ingestSensorBatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const data = await ingestSensorBatch(parsed.data);
  return res.status(201).json(data);
}));

sensorRouter.get("/api/iot/sensors/latest", asyncHandler(async (req, res) => {
  const parsed = latestQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", errors: parsed.error.flatten() });
  }

  const items = await getLatestByFarm(parsed.data.farmId);
  return res.json({
    farmId: parsed.data.farmId,
    items
  });
}));

sensorRouter.get("/api/iot/latest", asyncHandler(async (req, res) => {
  const parsed = latestQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", errors: parsed.error.flatten() });
  }

  const items = await getLatestByFarm(parsed.data.farmId);
  return res.json({
    farmId: parsed.data.farmId,
    items
  });
}));

sensorRouter.get("/api/iot/sensors/history", asyncHandler(async (req, res) => {
  const parsed = historyQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", errors: parsed.error.flatten() });
  }

  const history = await getHistory(parsed.data);
  return res.json(history);
}));

sensorRouter.get("/api/iot/history", asyncHandler(async (req, res) => {
  const parsed = historyQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", errors: parsed.error.flatten() });
  }

  const history = await getHistory(parsed.data);
  return res.json(history);
}));

sensorRouter.get("/api/iot/sensors/dashboard", asyncHandler(async (req, res) => {
  const parsed = dashboardQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", errors: parsed.error.flatten() });
  }

  const dashboard = await getDashboard(parsed.data);
  return res.json(dashboard);
}));

sensorRouter.get("/api/iot/dashboard", asyncHandler(async (req, res) => {
  const parsed = dashboardQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", errors: parsed.error.flatten() });
  }

  const dashboard = await getDashboard(parsed.data);
  return res.json(dashboard);
}));

export { sensorRouter };
