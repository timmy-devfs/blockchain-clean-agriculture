import { SeasonStatus } from "@prisma/client";
import { z } from "zod";

export const createSeasonSchema = z.object({
  farmId: z.string().trim().min(1),
  productCategoryId: z.string().trim().min(1).optional(),
  cropType: z.string().trim().min(1),
  startDate: z.coerce.date(),
  estimatedEndDate: z.coerce.date().optional()
});

export const updateSeasonSchema = z
  .object({
    productCategoryId: z.string().trim().min(1).optional(),
    cropType: z.string().trim().min(1).optional(),
    startDate: z.coerce.date().optional(),
    estimatedEndDate: z.coerce.date().optional(),
    status: z.nativeEnum(SeasonStatus).optional(),
    totalYield: z.coerce.number().positive().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const listSeasonsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  farmId: z.string().trim().min(1).optional(),
  cropType: z.string().trim().min(1).optional(),
  status: z.nativeEnum(SeasonStatus).optional()
});

export const createSeasonUpdateSchema = z.object({
  status: z.nativeEnum(SeasonStatus),
  note: z.string().trim().min(1).optional(),
  imageUrls: z.array(z.string().trim().min(1)).max(20).optional()
});

export const adminListSeasonsQuerySchema = z.object({
  onChain: z.enum(["all", "pending", "confirmed"]).default("pending")
});

export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;
export type UpdateSeasonInput = z.infer<typeof updateSeasonSchema>;
export type ListSeasonsQueryInput = z.infer<typeof listSeasonsQuerySchema>;
export type CreateSeasonUpdateInput = z.infer<typeof createSeasonUpdateSchema>;
export type AdminListSeasonsQueryInput = z.infer<typeof adminListSeasonsQuerySchema>;
