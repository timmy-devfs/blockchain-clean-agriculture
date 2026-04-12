import { env } from "../../config/env";

export const kafkaTopics = {
  iotAlert: env.KAFKA_TOPIC_IOT_ALERT
};
