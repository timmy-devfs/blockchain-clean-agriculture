import { SensorType } from "@prisma/client";
import { z } from "zod";

export const sensorReadingSchema = z.object({
  farmId: z.string().trim().min(1),
  sensorId: z.string().trim().min(1),
  type: z.nativeEnum(SensorType),
  value: z.coerce.number(),
  unit: z.string().trim().min(1)
});

export const ingestSensorBatchSchema = z.object({
  readings: z.array(sensorReadingSchema).min(1).max(1000)
});

export const latestQuerySchema = z.object({
  farmId: z.string().trim().min(1)
});

export const historyQuerySchema = z.object({
  farmId: z.string().trim().min(1),
  sensorId: z.string().trim().min(1).optional(),
  type: z.nativeEnum(SensorType).optional(),
  hours: z.coerce.number().int().min(1).max(24).default(24)
});

export const dashboardQuerySchema = z.object({
  farmId: z.string().trim().min(1)
});

export type SensorReadingInput = z.infer<typeof sensorReadingSchema>;
export type IngestSensorBatchInput = z.infer<typeof ingestSensorBatchSchema>;
export type LatestQueryInput = z.infer<typeof latestQuerySchema>;
export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;
export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;
