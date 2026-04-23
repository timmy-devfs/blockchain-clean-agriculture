import { NextFunction, Request, Response, Router } from "express";
import { mapSeasonToDetail, mapSeasonToListItem } from "../mappers/season.mapper";
import {
  createSeasonSchema,
  createSeasonUpdateSchema,
  listSeasonsQuerySchema,
  updateSeasonSchema
} from "../schemas/season.schema";
import {
  createSeason,
  createSeasonUpdate,
  exportSeason,
  getSeasonDetail,
  getSeasons,
  updateSeason
} from "../services/season.service";

const seasonRouter = Router();

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

seasonRouter.post("/api/farm/seasons", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = createSeasonSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid payload",
      errors: parsed.error.flatten()
    });
  }

  const season = await createSeason(userId, parsed.data);
  if (!season) {
    return res.status(404).json({ message: "Farm not found" });
  }

  return res.status(201).json(mapSeasonToListItem(season));
}));

seasonRouter.get("/api/farm/seasons", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = listSeasonsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", errors: parsed.error.flatten() });
  }

  const data = await getSeasons(userId, parsed.data);
  return res.json(data);
}));

seasonRouter.get("/api/farm/seasons/:id", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const season = await getSeasonDetail(req.params.id, userId);
  if (!season) {
    return res.status(404).json({ message: "Season not found" });
  }

  return res.json(mapSeasonToDetail(season));
}));

seasonRouter.put("/api/farm/seasons/:id", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = updateSeasonSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const season = await updateSeason(req.params.id, userId, parsed.data);
  if (!season) {
    return res.status(404).json({ message: "Season not found" });
  }

  return res.json(mapSeasonToListItem(season));
}));

seasonRouter.post("/api/farm/seasons/:id/updates", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = createSeasonUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const season = await createSeasonUpdate(req.params.id, userId, parsed.data);
  if (!season) {
    return res.status(404).json({ message: "Season not found" });
  }

  return res.status(201).json(mapSeasonToDetail(season));
}));

seasonRouter.post("/api/farm/seasons/:id/export", asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const result = await exportSeason(req.params.id, userId);

  if (result.type === "NOT_FOUND") {
    return res.status(404).json({ message: "Season not found" });
  }

  if (result.type === "INVALID_STATUS") {
    return res.status(400).json({
      errorCode: 2001,
      message: "Season must be HARVESTED before export",
      currentStatus: result.currentStatus
    });
  }

  return res.json(mapSeasonToListItem(result.season));
}));

export { seasonRouter };

/**
 * Ví dụ JSDoc trong route file src/routes/season.routes.ts:
 * @openapi
 * /api/farm/seasons:
 *   post:
 *     tags: [Season]
 *     summary: Tạo vụ mùa mới
 *     description: Publish SeasonCreatedEvent → Kafka → blockchain-service ghi VeChainThor
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cropType, startDate]
 *             properties:
 *               cropType:
 *                 type: string
 *                 example: "Lúa Hè Thu"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-06-01"
 *               area:
 *                 type: number
 *                 example: 5.5
 *                 description: "Diện tích (hecta)"
 *     responses:
 *       201:
 *         description: Tạo thành công — txHash = null, đang ghi blockchain
 *       403:
 *         description: Farm chưa được phê duyệt (ErrorCode 2001)
 */
// router.post('/', authMiddleware, createSeason);