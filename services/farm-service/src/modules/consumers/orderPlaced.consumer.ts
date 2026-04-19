import { Consumer, EachMessagePayload } from "kafkajs";
import { env } from "../../config/env";
import { createOrderFromPlacedEvent, parseOrderPlacedEvent } from "../services/order.service";

const ORDER_PLACED_TOPIC = env.KAFKA_TOPIC_ORDER_PLACED;

const processMessage = async ({ message }: EachMessagePayload): Promise<void> => {
  const raw = message.value?.toString();
  if (!raw) {
    return;
  }

  try {
    const payload = parseOrderPlacedEvent(JSON.parse(raw));
    await createOrderFromPlacedEvent(payload);
  } catch (error) {
    console.error("[farm-service] Failed to process order placed event", error);
  }
};

export const startOrderPlacedConsumer = async (consumer: Consumer): Promise<void> => {
  await consumer.subscribe({
    topic: ORDER_PLACED_TOPIC,
    fromBeginning: false
  });

  await consumer.run({
    eachMessage: processMessage
  });
};
