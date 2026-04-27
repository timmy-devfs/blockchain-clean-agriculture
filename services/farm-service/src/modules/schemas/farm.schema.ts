import { z } from "zod";

export const createFarmSchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1).optional(),
  province: z.string().trim().min(1).optional(),
  area: z.coerce.number().positive().optional()
});

export const updateFarmSchema = createFarmSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required"
});

export const uploadLicenseSchema = z.object({
  licenseNumber: z.string().trim().min(1),
  issuedBy: z.string().trim().min(1).optional(),
  issuedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional()
});

export const adminRejectSchema = z.object({
  rejectReason: z.string().trim().min(1)
});

export const adminFarmStatusQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(200).default(20)
});

export type CreateFarmInput = z.infer<typeof createFarmSchema>;
export type UpdateFarmInput = z.infer<typeof updateFarmSchema>;
export type UploadLicenseInput = z.infer<typeof uploadLicenseSchema>;
export type AdminRejectInput = z.infer<typeof adminRejectSchema>;
export type AdminFarmStatusQuery = z.infer<typeof adminFarmStatusQuerySchema>;
