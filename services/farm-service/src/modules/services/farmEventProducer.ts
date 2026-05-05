import { env } from "../../config/env";
import { kafkaProducer } from "../../config/kafka.producer.config";
import { kafkaTopics } from "../constants/kafkaTopics";

export type FarmEventType = keyof typeof kafkaTopics;

export const publishFarmEvent = async (eventType: FarmEventType, payload: unknown): Promise<void> => {
  try {
    await kafkaProducer.send({
      topic: kafkaTopics[eventType],
      messages: [
        {
          value: JSON.stringify(payload)
        }
      ]
    });
  } catch (error) {
    if (!env.KAFKA_OPTIONAL) {
      throw error;
    }

    console.warn("[farm-service] Skip publishing event because Kafka is unavailable", {
      eventType
    });
  }
};
