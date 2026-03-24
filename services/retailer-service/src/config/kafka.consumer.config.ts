import { env } from "./env";
import { kafkaClient } from "./kafka.client";

export const kafkaConsumer = kafkaClient.consumer({ groupId: env.KAFKA_GROUP_ID });

export async function connectConsumer(): Promise<void> {
  await kafkaConsumer.connect();
}
