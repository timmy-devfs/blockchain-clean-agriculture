import { Kafka, logLevel } from "kafkajs";
import { env } from "./env";

const brokers = env.KAFKA_BROKERS.split(",").map((broker) => broker.trim());

export const kafka = new Kafka({
  clientId: env.KAFKA_CLIENT_ID,
  brokers,
  logLevel: logLevel.INFO
});