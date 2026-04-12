import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(8087),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  REDIS_OPTIONAL: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  KAFKA_BROKERS: z.string().min(1),
  KAFKA_CLIENT_ID: z.string().default("iot-service"),
  KAFKA_TOPIC_IOT_ALERT: z.string().default("bicap.iot.alert"),
  KAFKA_OPTIONAL: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  IOT_SUMMARY_CRON: z.string().default("0 6 * * *"),
  IOT_SUMMARY_TIMEZONE: z.string().default("Asia/Bangkok")
});

export const env = envSchema.parse(process.env);
