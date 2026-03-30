import { env } from "./env";
import { kafka } from "./kafka.client";

export const kafkaConsumer = kafka.consumer({
  groupId: env.KAFKA_GROUP_ID
});

export const connectKafkaConsumer = async (): Promise<void> => {
  await kafkaConsumer.connect();
  console.log("[farm-service] Kafka consumer connected");
};

export const disconnectKafkaConsumer = async (): Promise<void> => {
  await kafkaConsumer.disconnect();
};