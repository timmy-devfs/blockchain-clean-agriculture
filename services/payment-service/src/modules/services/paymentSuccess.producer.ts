import { randomUUID } from "crypto";
import { PaymentType } from "@prisma/client";
import { publishEvent } from "../../config/kafka.producer.config";
import { kafkaTopics } from "../constants/kafkaTopics";

export const publishPaymentSuccess = async (payload: {
  paymentId: string;
  orderId: string;
  amount: number;
  type: PaymentType;
  paidAt: Date;
}): Promise<void> => {
  await publishEvent(kafkaTopics.paymentSuccess, {
    eventId: randomUUID(),
    eventType: "PaymentSuccessEvent",
    timestamp: new Date().toISOString(),
    payload: {
      paymentId: payload.paymentId,
      orderId: payload.orderId,
      amount: payload.amount,
      type: payload.type,
      paidAt: payload.paidAt.toISOString()
    }
  });
};
