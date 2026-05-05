import { kafka } from "./kafka.client";

export const kafkaProducer = kafka.producer();

export const connectKafkaProducer = async (): Promise<void> => {
  await kafkaProducer.connect();
  console.log("[iot-service] Kafka producer connected");
};

export const disconnectKafkaProducer = async (): Promise<void> => {
  await kafkaProducer.disconnect();
};
