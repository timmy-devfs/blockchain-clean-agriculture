import { env } from "../../config/env";

export const kafkaTopics = {
  paymentSuccess: env.KAFKA_TOPIC_PAYMENT_SUCCESS
};
