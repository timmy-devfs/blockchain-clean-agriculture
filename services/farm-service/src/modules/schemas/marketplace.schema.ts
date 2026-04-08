import { z } from "zod";

export const createListingSchema = z.object({
  farmId: z.string().trim().min(1),
  seasonId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().positive()
});

export const updateListingSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    quantity: z.coerce.number().positive().optional(),
    unitPrice: z.coerce.number().positive().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required"
  });

export const listMyListingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  farmId: z.string().trim().min(1).optional(),
  seasonId: z.string().trim().min(1).optional(),
  keyword: z.string().trim().min(1).optional()
});

export const subscribePackageSchema = z.object({
  farmId: z.string().trim().min(1)
});

export const myPackageQuerySchema = z.object({
  farmId: z.string().trim().min(1)
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListMyListingsQueryInput = z.infer<typeof listMyListingsQuerySchema>;
export type SubscribePackageInput = z.infer<typeof subscribePackageSchema>;
export type MyPackageQueryInput = z.infer<typeof myPackageQuerySchema>;
