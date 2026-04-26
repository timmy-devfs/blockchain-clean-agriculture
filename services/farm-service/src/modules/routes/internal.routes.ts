import { Router } from "express";
import { z } from "zod";
import { applySeasonBlockchainRecord } from "../services/season.service";

const internalRouter = Router();

const blockchainBodySchema = z.object({
  txHash: z.string().trim().min(1).max(128),
  confirmedAt: z.coerce.date().optional()
});

/**
 * Gọi nội bộ từ blockchain-service (không qua API Gateway).
 * Bảo vệ bằng X-Internal-Key — mount trước jwtMiddleware trong app.ts.
 */
internalRouter.put("/api/farm/seasons/:id/blockchain", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY?.trim();
  if (!expected) {
    return res.status(503).json({ message: "Internal callback is not configured" });
  }

  const provided = typeof req.headers["x-internal-key"] === "string" ? req.headers["x-internal-key"].trim() : "";
  if (provided !== expected) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = blockchainBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const seasonId = req.params.id;
  const confirmedAt = parsed.data.confirmedAt ?? new Date();

  const result = await applySeasonBlockchainRecord(seasonId, {
    txHash: parsed.data.txHash,
    confirmedAt
  });

  if (result.type === "NOT_FOUND") {
    return res.status(404).json({ message: "Season not found" });
  }

  return res.json({ message: "OK", seasonId, txHash: parsed.data.txHash });
});

export { internalRouter };
