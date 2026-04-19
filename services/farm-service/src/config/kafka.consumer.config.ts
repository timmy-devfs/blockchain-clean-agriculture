import { env } from "./env";
import { kafka } from "./kafka.client";
import { startOrderPlacedConsumer } from "../modules/consumers/orderPlaced.consumer";

export const kafkaConsumer = kafka.consumer({
  groupId: env.KAFKA_GROUP_ID
});

export const connectKafkaConsumer = async (): Promise<void> => {
  await kafkaConsumer.connect();
  await startOrderPlacedConsumer(kafkaConsumer);
  console.log("[farm-service] Kafka consumer connected");
};

export const disconnectKafkaConsumer = async (): Promise<void> => {
  await kafkaConsumer.disconnect();
};
