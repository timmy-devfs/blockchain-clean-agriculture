import { AxiosError } from "axios";
import { z } from "zod";
import { chainAxios, farmAxios } from "../config/axios.instances";
import { redisClient } from "../config/redis.config";
import { AppError } from "../errors/appError";

const CACHE_TTL_SECONDS = 120;
const CACHE_KEY_PREFIX = "retailer:marketplace:products:v1";

const searchProductsQuerySchema = z.object({
  keyword: z.string().trim().min(1).optional(),
  farmId: z.string().trim().min(1).optional(),
  productType: z.string().trim().min(1).optional(),
  province: z.string().trim().min(1).optional(),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(100).default(20)
});

type SearchProductsQuery = z.infer<typeof searchProductsQuerySchema>;

type TracePayload = {
  seasonId?: string;
  farmId?: string;
  cropType?: string;
  txHash?: string;
  history?: unknown[];
};

function normalizeQuery(payload: unknown): SearchProductsQuery {
  const parsed = searchProductsQuerySchema.parse(payload);

  if (
    parsed.priceMin !== undefined &&
    parsed.priceMax !== undefined &&
    parsed.priceMin > parsed.priceMax
  ) {
    throw new AppError("INVALID_REQUEST", "priceMin must be less than or equal to priceMax");
  }

  return parsed;
}

function cacheKeyOf(query: SearchProductsQuery): string {
  return `${CACHE_KEY_PREFIX}:${JSON.stringify(query)}`;
}

function isAxiosError(error: unknown): error is AxiosError {
  return !!error && typeof error === "object" && "isAxiosError" in error;
}

function mapDownstreamError(error: unknown, notFoundCode: "PRODUCT_NOT_FOUND" | "FARM_NOT_FOUND"): AppError {
  if (isAxiosError(error)) {
    if (error.response?.status === 404) {
      return new AppError(notFoundCode);
    }
    return new AppError("MARKETPLACE_UNAVAILABLE");
  }

  return new AppError("MARKETPLACE_UNAVAILABLE");
}

function buildSeasonSummary(trace: TracePayload | null): Record<string, unknown> | null {
  if (!trace) {
    return null;
  }

  const history = Array.isArray(trace.history) ? trace.history : [];
  return {
    seasonId: trace.seasonId,
    farmId: trace.farmId,
    cropType: trace.cropType,
    txHash: trace.txHash,
    totalEvents: history.length
  };
}

async function getJsonCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await redisClient.get(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function setJsonCache(key: string, value: unknown): Promise<void> {
  try {
    await redisClient.set(key, JSON.stringify(value), "EX", CACHE_TTL_SECONDS);
  } catch {
    // Best-effort cache; do not block API response
  }
}

export const marketplaceService = {
  async searchProducts(queryPayload: unknown): Promise<unknown> {
    const query = normalizeQuery(queryPayload);
    const key = cacheKeyOf(query);

    const cached = await getJsonCache<unknown>(key);
    if (cached !== null) {
      return cached;
    }

    try {
      const response = await farmAxios.get("/api/farm/marketplace/products", {
        params: query
      });
      const body = response.data as { total?: number; items?: unknown[] };
      const total =
        typeof body.total === "number"
          ? body.total
          : Array.isArray(body.items)
            ? body.items.length
            : 0;
      // Không cache kết quả rỗng: tránh sau khi farm tạo listing mới, retailer vẫn thấy catalog trống 120s.
      if (total > 0) {
        await setJsonCache(key, response.data);
      }
      return response.data;
    } catch (error) {
      throw mapDownstreamError(error, "PRODUCT_NOT_FOUND");
    }
  },

  async getProductDetail(productId: string): Promise<unknown> {
    const id = z.string().trim().min(1).parse(productId);

    let product: Record<string, unknown>;
    try {
      const response = await farmAxios.get(`/api/farm/marketplace/products/${encodeURIComponent(id)}`);
      product = response.data as Record<string, unknown>;
    } catch (error) {
      throw mapDownstreamError(error, "PRODUCT_NOT_FOUND");
    }

    const farmId = typeof product.farmId === "string" ? product.farmId : undefined;
    const seasonId = typeof product.seasonId === "string" ? product.seasonId : undefined;

    const farmPromise = farmId
      ? farmAxios
          .get(`/api/farm/marketplace/farms/${encodeURIComponent(farmId)}`)
          .then((res) => res.data)
          .catch(() => null)
      : Promise.resolve(null);

    const seasonPromise = seasonId
      ? chainAxios
          .get(`/api/chain/trace/${encodeURIComponent(seasonId)}`)
          .then((res) => res.data as TracePayload)
          .catch(() => null)
      : Promise.resolve(null);

    const [farm, trace] = await Promise.all([farmPromise, seasonPromise]);

    return {
      ...product,
      farm,
      seasonSummary: buildSeasonSummary(trace)
    };
  },

  async getFarmProfile(farmId: string): Promise<unknown> {
    const id = z.string().trim().min(1).parse(farmId);

    try {
      const response = await farmAxios.get(`/api/farm/marketplace/farms/${encodeURIComponent(id)}`);
      return response.data;
    } catch (error) {
      throw mapDownstreamError(error, "FARM_NOT_FOUND");
    }
  }
};
