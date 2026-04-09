import { kafkaClient } from "./kafka.client";

export const kafkaProducer = kafkaClient.producer();
let producerConnected = false;

export async function connectProducer(): Promise<void> {
  if (producerConnected) {
    return;
  }
  await kafkaProducer.connect();
  producerConnected = true;
}

export async function publishEvent(topic: string, payload: unknown): Promise<void> {
  await connectProducer();
  await kafkaProducer.send({
    topic,
    messages: [{ value: JSON.stringify(payload) }]
  });
}
