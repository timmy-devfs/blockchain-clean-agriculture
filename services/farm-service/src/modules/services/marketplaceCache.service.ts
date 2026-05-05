import { redis } from "../../config/redis.config";
import { ListMyListingsQueryInput } from "../schemas/marketplace.schema";

const LISTING_CACHE_PREFIX = "farm:marketplace:listings:my:";
const LISTING_CACHE_TTL_SECONDS = 120;

const buildListingCacheKey = (userId: string, query: ListMyListingsQueryInput): string =>
  `${LISTING_CACHE_PREFIX}${userId}:${query.page}:${query.limit}:${query.farmId ?? ""}:${query.seasonId ?? ""}:${query.keyword ?? ""}`;

export const getCachedMyListings = async <T>(
  userId: string,
  query: ListMyListingsQueryInput
): Promise<T | null> => {
  try {
    if (redis.status !== "ready") {
      return null;
    }

    const key = buildListingCacheKey(userId, query);
    const cached = await redis.get(key);
    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as T;
  } catch (error) {
    console.warn("[farm-service] Failed to read listing cache", error);
    return null;
  }
};

export const setCachedMyListings = async <T>(
  userId: string,
  query: ListMyListingsQueryInput,
  payload: T
): Promise<void> => {
  try {
    if (redis.status !== "ready") {
      return;
    }

    const key = buildListingCacheKey(userId, query);
    await redis.set(key, JSON.stringify(payload), "EX", LISTING_CACHE_TTL_SECONDS);
  } catch (error) {
    console.warn("[farm-service] Failed to write listing cache", error);
  }
};

export const evictMyListingsCache = async (userId: string): Promise<void> => {
  try {
    if (redis.status !== "ready") {
      return;
    }

    const keys = await redis.keys(`${LISTING_CACHE_PREFIX}${userId}:*`);
    if (keys.length === 0) {
      return;
    }

    await redis.del(...keys);
  } catch (error) {
    console.warn("[farm-service] Failed to evict listing cache", error);
  }
};
