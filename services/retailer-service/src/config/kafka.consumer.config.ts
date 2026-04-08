import { env } from "./env";
import { kafkaClient } from "./kafka.client";
import { kafkaTopics } from "../constants/kafkaTopics";
import { handlePaymentSuccessMessage } from "../consumers/paymentSuccess.consumer";
import { handleOrderConfirmedMessage } from "../consumers/orderConfirmed.consumer";
import { handleShipmentUpdatedMessage } from "../consumers/shipmentUpdated.consumer";

export const kafkaConsumer = kafkaClient.consumer({ groupId: env.KAFKA_GROUP_ID });
let consumerRunning = false;

export async function connectConsumer(): Promise<void> {
  if (consumerRunning) {
    return;
  }

  await kafkaConsumer.connect();
  await kafkaConsumer.subscribe({ topic: kafkaTopics.PAYMENT_SUCCESS, fromBeginning: false });
  await kafkaConsumer.subscribe({ topic: kafkaTopics.ORDER_CONFIRMED, fromBeginning: false });
  await kafkaConsumer.subscribe({ topic: kafkaTopics.SHIPMENT_UPDATED, fromBeginning: false });

  await kafkaConsumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) {
        return;
      }

      let payload: unknown;
      try {
        payload = JSON.parse(message.value.toString());
      } catch (error) {
        console.warn("Invalid Kafka message JSON:", error);
        return;
      }

      try {
        if (topic === kafkaTopics.PAYMENT_SUCCESS) {
          await handlePaymentSuccessMessage(payload);
          return;
        }

        if (topic === kafkaTopics.ORDER_CONFIRMED) {
          await handleOrderConfirmedMessage(payload);
          return;
        }

        if (topic === kafkaTopics.SHIPMENT_UPDATED) {
          await handleShipmentUpdatedMessage(payload);
        }
      } catch (error) {
        console.warn(`Kafka handler warning on topic ${topic}:`, error);
      }
    }
  });

  consumerRunning = true;
}
