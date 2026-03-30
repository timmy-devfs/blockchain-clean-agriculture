import { kafkaProducer } from "../../config/kafka.producer.config";
import { kafkaTopics } from "../constants/kafkaTopics";

export type FarmEventType = keyof typeof kafkaTopics;

export const publishFarmEvent = async (eventType: FarmEventType, payload: unknown): Promise<void> => {
  await kafkaProducer.send({
    topic: kafkaTopics[eventType],
    messages: [
      {
        value: JSON.stringify(payload)
      }
    ]
  });
};