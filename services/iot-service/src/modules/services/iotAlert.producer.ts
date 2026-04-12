import { randomUUID } from "crypto";
import { env } from "../../config/env";
import { kafkaProducer } from "../../config/kafka.producer.config";
import { kafkaTopics } from "../constants/kafkaTopics";

type IoTAlertPayload = {
  farmId: string;
  sensorId: string;
  type: string;
  value: number;
  unit: string;
  rule: string;
  occurredAt: string;
};

export const publishIoTAlert = async (payload: IoTAlertPayload): Promise<void> => {
  try {
    await kafkaProducer.send({
      topic: kafkaTopics.iotAlert,
      messages: [
        {
          value: JSON.stringify({
            eventId: randomUUID(),
            eventType: "IoTAlertEvent",
            timestamp: new Date().toISOString(),
            payload
          })
        }
      ]
    });
  } catch (error) {
    if (!env.KAFKA_OPTIONAL) {
      throw error;
    }
    console.warn("[iot-service] Skip publishing IoT alert because Kafka is unavailable");
  }
};
