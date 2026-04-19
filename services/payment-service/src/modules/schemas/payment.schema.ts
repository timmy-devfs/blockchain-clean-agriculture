import { PaymentGateway, PaymentType } from "@prisma/client";
import { z } from "zod";

export const createPaymentSchema = z.object({
  orderId: z.string().trim().min(1),
  amount: z.coerce.number().positive(),
  type: z.nativeEnum(PaymentType).default(PaymentType.DEPOSIT),
  gateway: z.nativeEnum(PaymentGateway),
  payerId: z.string().trim().min(1).optional(),
  returnUrl: z.string().url().optional()
});

export const callbackSchema = z.object({
  paymentId: z.string().trim().min(1),
  orderId: z.string().trim().min(1),
  amount: z.coerce.number().positive(),
  type: z.nativeEnum(PaymentType),
  gateway: z.nativeEnum(PaymentGateway),
  transactionId: z.string().trim().min(1),
  paidAt: z.string().datetime().optional(),
  signature: z.string().trim().min(1)
});

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const refundSchema = z.object({
  reason: z.string().trim().min(1).optional()
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type CallbackInput = z.infer<typeof callbackSchema>;
export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;
export type RefundInput = z.infer<typeof refundSchema>;
