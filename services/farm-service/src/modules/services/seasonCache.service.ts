import { redis } from "../../config/redis.config";
import { ListSeasonsQueryInput } from "../schemas/season.schema";

const SEASON_LIST_CACHE_PREFIX = "farm:season:list:";
const SEASON_LIST_TTL_SECONDS = 300;

const buildSeasonListCacheKey = (userId: string, query: ListSeasonsQueryInput): string =>
  `${SEASON_LIST_CACHE_PREFIX}${userId}:${query.page}:${query.limit}:${query.farmId ?? ""}:${query.cropType ?? ""}:${query.status ?? ""}`;

export const getCachedSeasonList = async <T>(
  userId: string,
  query: ListSeasonsQueryInput
): Promise<T | null> => {
  try {
    if (redis.status !== "ready") {
      return null;
    }

    const key = buildSeasonListCacheKey(userId, query);
    const cached = await redis.get(key);
    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as T;
  } catch (error) {
    console.warn("[farm-service] Failed to read season list cache", error);
    return null;
  }
};

export const setCachedSeasonList = async <T>(
  userId: string,
  query: ListSeasonsQueryInput,
  payload: T
): Promise<void> => {
  try {
    if (redis.status !== "ready") {
      return;
    }

    const key = buildSeasonListCacheKey(userId, query);
    await redis.set(key, JSON.stringify(payload), "EX", SEASON_LIST_TTL_SECONDS);
  } catch (error) {
    console.warn("[farm-service] Failed to write season list cache", error);
  }
};

export const evictSeasonListCache = async (userId: string): Promise<void> => {
  try {
    if (redis.status !== "ready") {
      return;
    }

    const keys = await redis.keys(`${SEASON_LIST_CACHE_PREFIX}${userId}:*`);
    if (keys.length === 0) {
      return;
    }

    await redis.del(...keys);
  } catch (error) {
    console.warn("[farm-service] Failed to evict season list cache", error);
  }
};
