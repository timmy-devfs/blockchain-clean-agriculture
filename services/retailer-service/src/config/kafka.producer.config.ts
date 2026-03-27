import { kafkaClient } from "./kafka.client";

export const kafkaProducer = kafkaClient.producer();

export async function connectProducer(): Promise<void> {
  await kafkaProducer.connect();
}
