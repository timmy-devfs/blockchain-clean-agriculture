import { env } from "../../config/env";

export const kafkaTopics = {
  seasonCreated: env.KAFKA_TOPIC_SEASON_CREATED,
  seasonUpdated: env.KAFKA_TOPIC_SEASON_UPDATED,
  seasonExported: env.KAFKA_TOPIC_SEASON_EXPORTED,
  orderConfirmed: env.KAFKA_TOPIC_ORDER_CONFIRMED
};