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
  KAFKA_TOPIC_SEASON_CREATED: z.string().default("farm.season-created"),
  KAFKA_TOPIC_SEASON_UPDATED: z.string().default("farm.season-updated"),
  KAFKA_TOPIC_SEASON_EXPORTED: z.string().default("farm.season-exported"),
  KAFKA_TOPIC_ORDER_CONFIRMED: z.string().default("farm.order-confirmed"),
  REDIS_OPTIONAL: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  REDIS_URL: z.string().min(1)
});

export const env = envSchema.parse(process.env);
