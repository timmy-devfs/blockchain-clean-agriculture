import { OrderStatus } from "@prisma/client";
import { z } from "zod";

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(OrderStatus).optional()
});

export const rejectOrderSchema = z.object({
  rejectReason: z.string().trim().min(1)
});

export type ListOrdersQueryInput = z.infer<typeof listOrdersQuerySchema>;
export type RejectOrderInput = z.infer<typeof rejectOrderSchema>;
