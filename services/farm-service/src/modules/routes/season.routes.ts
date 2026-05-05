import { NextFunction, Request, Response, Router } from "express";
import { mapSeasonToDetail, mapSeasonToListItem } from "../mappers/season.mapper";
import {
  adminListSeasonsQuerySchema,
  createSeasonSchema,
  createSeasonUpdateSchema,
  listSeasonsQuerySchema,
  updateSeasonSchema
} from "../schemas/season.schema";
import {
  adminApproveSeasonForBlockchain,
  createSeason,
  createSeasonUpdate,
  exportSeason,
  getAdminSeasons,
  getSeasonDetail,
  getSeasons,
  updateSeason
} from "../services/season.service";

const seasonRouter = Router();
const isAdmin = (role?: string): boolean => role?.toUpperCase() === "ADMIN";
const isMongoObjectId = (value: string): boolean => /^[a-fA-F0-9]{24}$/.test(value);

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

  const result = await createSeason(userId, parsed.data);
  if (result.type === "NOT_FOUND") {
    return res.status(404).json({ message: "Farm not found" });
  }
  if (result.type === "FARM_NOT_APPROVED") {
    return res.status(403).json({
      errorCode: 2001,
      message: "Farm chưa được admin phê duyệt, không thể tạo mùa vụ"
    });
  }

  return res.status(201).json(mapSeasonToListItem(result.season));
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
  if (!isMongoObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid season id format" });
  }

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
  if (!isMongoObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid season id format" });
  }

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
  if (!isMongoObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid season id format" });
  }

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
  if (!isMongoObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid season id format" });
  }

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

seasonRouter.get("/api/farm/admin/seasons", asyncHandler(async (req, res) => {
  if (!isAdmin(req.user?.userRole)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const parsed = adminListSeasonsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", errors: parsed.error.flatten() });
  }

  const seasons = await getAdminSeasons(parsed.data.onChain);
  return res.json(
    seasons.map((s) => ({
      ...mapSeasonToListItem(s),
      farmName: s.farm.name,
      province: s.farm.province ?? "",
    }))
  );
}));

seasonRouter.put("/api/farm/admin/seasons/:id/approve", asyncHandler(async (req, res) => {
  if (!isMongoObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid season id format" });
  }

  if (!isAdmin(req.user?.userRole)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const adminUserId = req.user?.userId ?? "unknown-admin";
  const result = await adminApproveSeasonForBlockchain(req.params.id, adminUserId);

  if (result.type === "NOT_FOUND") {
    return res.status(404).json({ message: "Season not found" });
  }

  if (result.type === "FARM_NOT_APPROVED") {
    return res.status(400).json({
      errorCode: 2002,
      message: "Farm chưa được phê duyệt nên không thể duyệt mùa vụ lên blockchain"
    });
  }

  if (result.type === "ALREADY_PUBLISHED") {
    return res.status(409).json({
      errorCode: 2003,
      message: "Season đã được duyệt/phát sự kiện ghi blockchain trước đó"
    });
  }

  return res.json({
    message: "Season approved, event SEASON_CREATED đã được publish để ghi blockchain",
    data: mapSeasonToListItem(result.season)
  });
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