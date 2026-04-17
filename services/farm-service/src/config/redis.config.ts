import Redis from "ioredis";
import { env } from "./env";

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (attempt: number) => {
    if (env.REDIS_OPTIONAL) {
      return null;
    }
    return Math.min(attempt * 200, 2000);
  }
});
redis.on("error", (error) => {
  console.warn("[farm-service] Redis error", error.message);
});

export const connectRedis = async (): Promise<void> => {
  await redis.connect();
  await redis.ping();
  console.log("[farm-service] Redis connected");
};

export const disconnectRedis = async (): Promise<void> => {
  if (redis.status !== "end") {
    await redis.quit();
  }
};
