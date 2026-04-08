import { z } from "zod";
import { AppError } from "../errors/appError";
import { orderService } from "../services/order.service";

const paymentSuccessEventSchema = z.object({
  payload: z.object({
    orderId: z.string().min(1),
    paymentId: z.string().optional(),
    transactionId: z.string().optional(),
    amount: z.number().optional()
  })
});

export async function handlePaymentSuccessMessage(eventPayload: unknown): Promise<void> {
  const parsed = paymentSuccessEventSchema.safeParse(eventPayload);
  if (!parsed.success) {
    throw new AppError("INVALID_EVENT_PAYLOAD", parsed.error.issues.map((item) => item.message).join("; "));
  }

  await orderService.markPaymentSuccess(parsed.data.payload);
}
