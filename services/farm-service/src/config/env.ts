import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(8082),
  DATABASE_URL: z.string().min(1),
  KAFKA_OPTIONAL: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  KAFKA_BROKERS: z.string().min(1),
  KAFKA_CLIENT_ID: z.string().default("farm-service"),
  KAFKA_GROUP_ID: z.string().default("farm-service-consumer"),
  KAFKA_TOPIC_ORDER_PLACED: z.string().default("retailer.order.created"),
  KAFKA_TOPIC_SEASON_CREATED: z.string().default("farm.season-created"),
  KAFKA_TOPIC_SEASON_UPDATED: z.string().default("farm.season-updated"),
  KAFKA_TOPIC_SEASON_EXPORTED: z.string().default("farm.season-exported"),
  /** Phải khớp topic shipping-service consume (mặc định bicap.order.confirmed). */
  KAFKA_TOPIC_ORDER_CONFIRMED: z.string().default("bicap.order.confirmed"),
  SHIPPING_SERVICE_BASE_URL: z.string().url().default("http://localhost:8084"),
  SHIPPING_SERVICE_SHIPMENTS_PATH: z.string().default("/api/shipping/shipments"),
  REDIS_OPTIONAL: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  REDIS_URL: z.string().min(1),
  /** Khớp với blockchain-service — callback PUT /api/farm/seasons/:id/blockchain */
  INTERNAL_API_KEY: z.string().optional().default("")
});

export const env = envSchema.parse(process.env);
