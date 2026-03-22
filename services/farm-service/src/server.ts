import { app } from "./app";
import { env } from "./config/env";
import { connectKafkaConsumer, disconnectKafkaConsumer } from "./config/kafka.consumer.config";
import { connectKafkaProducer, disconnectKafkaProducer } from "./config/kafka.producer.config";
import { connectRedis, disconnectRedis } from "./config/redis.config";
import { connectPrisma, disconnectPrisma } from "./database/prisma";

const start = async (): Promise<void> => {
  await connectPrisma();
  try {
    await connectKafkaProducer();
    await connectKafkaConsumer();
  } catch (error) {
    if (!env.KAFKA_OPTIONAL) {
      throw error;
    }
    console.warn("[farm-service] Kafka unavailable, starting in degraded mode");
  }
  try {
    await connectRedis();
  } catch (error) {
    if (!env.REDIS_OPTIONAL) {
      throw error;
    }
    console.warn("[farm-service] Redis unavailable, starting in degraded mode");
  }

  app.listen(env.PORT, () => {
    console.log(`[farm-service] Listening on port ${env.PORT}`);
  });
};

const shutdown = async (): Promise<void> => {
  await Promise.allSettled([
    disconnectPrisma(),
    disconnectKafkaProducer(),
    disconnectKafkaConsumer(),
    disconnectRedis()
  ]);
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch(async (error) => {
  console.error("[farm-service] Startup failed", error);
  await shutdown();
});
