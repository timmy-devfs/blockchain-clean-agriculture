import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(8086),
  DATABASE_URL: z.string().min(1),
  KAFKA_BROKERS: z.string().min(1),
  KAFKA_CLIENT_ID: z.string().default("payment-service"),
  KAFKA_TOPIC_PAYMENT_SUCCESS: z.string().default("bicap.payment.success"),
  KAFKA_OPTIONAL: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  JWT_SECRET: z.string().min(6).default("retailer-secret"),
  VNPAY_TMN_CODE: z.string().min(1),
  VNPAY_HASH_SECRET: z.string().min(1),
  VNPAY_URL: z.string().url(),
  VNPAY_RETURN_URL: z.string().url(),
  MOMO_PARTNER_CODE: z.string().min(1),
  MOMO_ACCESS_KEY: z.string().min(1),
  MOMO_SECRET_KEY: z.string().min(1),
  MOMO_ENDPOINT: z.string().url(),
  MOMO_RETURN_URL: z.string().url()
});

export const env = envSchema.parse(process.env);
