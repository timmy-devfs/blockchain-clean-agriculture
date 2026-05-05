import { env } from "./env";
import { kafka } from "./kafka.client";

export const kafkaProducer = kafka.producer();

export const connectKafkaProducer = async (): Promise<void> => {
  await kafkaProducer.connect();
  console.log("[payment-service] Kafka producer connected");
};

export const disconnectKafkaProducer = async (): Promise<void> => {
  await kafkaProducer.disconnect();
};

export const publishEvent = async (topic: string, payload: unknown): Promise<void> => {
  try {
    await kafkaProducer.send({
      topic,
      messages: [{ value: JSON.stringify(payload) }]
    });
  } catch (error) {
    if (!env.KAFKA_OPTIONAL) {
      throw error;
    }
    console.warn("[payment-service] Kafka unavailable, skip event publish");
  }
};
