import { app } from "./app";
import { env } from "./config/env";
import { connectConsumer } from "./config/kafka.consumer.config";
import { connectProducer } from "./config/kafka.producer.config";
import { redisClient } from "./config/redis.config";

async function withTimeout<T>(label: string, fn: () => Promise<T>, ms = 3000): Promise<void> {
  try {
    await Promise.race([
      fn().then(() => undefined),
      new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms);
      })
    ]);
  } catch (error) {
    console.warn(`${label} warning:`, error);
  }
}

async function bootstrap(): Promise<void> {
  if (env.INIT_INFRA_ON_BOOT) {
    await withTimeout("Kafka producer", connectProducer);
    await withTimeout("Kafka consumer", connectConsumer);
    await withTimeout("Redis ping", () => redisClient.ping());
  }

  app.listen(env.PORT, () => {
    console.log(`retailer-service listening on http://localhost:${env.PORT}`);
  });
}

void bootstrap();
