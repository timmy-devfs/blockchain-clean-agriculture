import { app } from "./app";
import { env } from "./config/env";
import { connectKafkaProducer, disconnectKafkaProducer } from "./config/kafka.producer.config";
import { connectRedis, disconnectRedis } from "./config/redis.config";
import { connectPrisma, disconnectPrisma } from "./database/prisma";
import { startDailyThresholdSummaryCron } from "./modules/services/summaryCron.service";

const start = async (): Promise<void> => {
  await connectPrisma();

  try {
    await connectKafkaProducer();
  } catch (error) {
    if (!env.KAFKA_OPTIONAL) {
      throw error;
    }
    console.warn("[iot-service] Kafka unavailable, starting in degraded mode");
  }

  try {
    await connectRedis();
  } catch (error) {
    if (!env.REDIS_OPTIONAL) {
      throw error;
    }
    await disconnectRedis();
    console.warn("[iot-service] Redis unavailable, starting in degraded mode");
  }

  startDailyThresholdSummaryCron();

  app.listen(env.PORT, () => {
    console.log(`[iot-service] Listening on port ${env.PORT}`);
  });
};

const shutdown = async (exitCode = 0): Promise<void> => {
  await Promise.allSettled([disconnectPrisma(), disconnectKafkaProducer(), disconnectRedis()]);
  process.exit(exitCode);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch(async (error) => {
  console.error("[iot-service] Startup failed", error);
  await shutdown(1);
});
