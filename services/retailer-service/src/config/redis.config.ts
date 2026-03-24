import Redis from "ioredis";
import { env } from "./env";

export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 2,
  enableReadyCheck: true,
  lazyConnect: true
});

redisClient.on("error", (error) => {
  console.warn("Redis warning:", error.message);
});
