import { app } from "./app";
import { connectKafkaProducer, disconnectKafkaProducer } from "./config/kafka.producer.config";
import { env } from "./config/env";
import { connectPrisma, disconnectPrisma } from "./database/prisma";

const start = async (): Promise<void> => {
  await connectPrisma();
  try {
    await connectKafkaProducer();
  } catch (error) {
    if (!env.KAFKA_OPTIONAL) {
      throw error;
    }
    console.warn("[payment-service] Kafka unavailable, starting in degraded mode");
  }

  app.listen(env.PORT, () => {
    console.log(`[payment-service] Listening on port ${env.PORT}`);
  });
};

const shutdown = async (exitCode = 0): Promise<void> => {
  await Promise.allSettled([disconnectPrisma(), disconnectKafkaProducer()]);
  process.exit(exitCode);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch(async (error) => {
  console.error("[payment-service] Startup failed", error);
  await shutdown(1);
});
