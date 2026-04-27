import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3007),
  MONGODB_URI: z.string().min(1),
  MONGODB_DB_NAME: z.string().default("retailer-service"),
  KAFKA_CLIENT_ID: z.string().default("retailer-service"),
  KAFKA_BROKERS: z.string().default("localhost:9092"),
  KAFKA_GROUP_ID: z.string().default("retailer-service-group"),
  INIT_INFRA_ON_BOOT: z.enum(["true", "false"]).default("false"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  FARM_SERVICE_BASE_URL: z.string().default("http://localhost:8082"),
  BLOCKCHAIN_SERVICE_BASE_URL: z.string().default("http://localhost:8090"),
  SHIPPING_SERVICE_BASE_URL: z.string().default("http://localhost:8084"),
  PAYMENT_SERVICE_BASE_URL: z.string().default("http://localhost:8086"),
  REPORT_SERVICE_BASE_URL: z.string().default("http://localhost:8088"),
  JWT_SECRET: z.string().min(6).default("retailer-secret"),
  /** true = bỏ gọi payment-service, đơn vào thẳng PLACED + Kafka (ORDER_PLACED + ORDER_CONFIRMED) để shipping tạo lô hàng */
  SKIP_ORDER_PAYMENT: z.enum(["true", "false"]).default("false")
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment variables: ${issues}`);
}

export const env = {
  ...parsed.data,
  INIT_INFRA_ON_BOOT: parsed.data.INIT_INFRA_ON_BOOT === "true",
  SKIP_ORDER_PAYMENT: parsed.data.SKIP_ORDER_PAYMENT === "true",
  KAFKA_BROKERS: parsed.data.KAFKA_BROKERS.split(",")
    .map((broker) => broker.trim())
    .filter(Boolean)
};
