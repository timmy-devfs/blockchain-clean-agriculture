import { Kafka } from "kafkajs";
import { env } from "./env";

export const kafkaClient = new Kafka({
  clientId: env.KAFKA_CLIENT_ID,
  brokers: env.KAFKA_BROKERS
});
