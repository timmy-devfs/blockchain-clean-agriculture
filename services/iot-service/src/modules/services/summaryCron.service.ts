import cron from "node-cron";
import { SensorType } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../database/prisma";

const types: SensorType[] = [SensorType.TEMP, SensorType.HUMIDITY, SensorType.PH];

export const startDailyThresholdSummaryCron = (): void => {
  cron.schedule(
    env.IOT_SUMMARY_CRON,
    async () => {
      try {
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const alertReadings = await prisma.sensorReading.findMany({
          where: {
            isAlert: true,
            createdAt: { gte: since24h }
          },
          select: {
            farmId: true,
            type: true
          }
        });

        const summary = new Map<string, { TEMP: number; HUMIDITY: number; PH: number }>();
        for (const row of alertReadings) {
          if (!summary.has(row.farmId)) {
            summary.set(row.farmId, { TEMP: 0, HUMIDITY: 0, PH: 0 });
          }
          const bucket = summary.get(row.farmId);
          if (!bucket) {
            continue;
          }
          bucket[row.type] += 1;
        }

        if (summary.size === 0) {
          console.log("[iot-service] Daily threshold summary: no alerts in last 24h");
          return;
        }

        for (const [farmId, bucket] of summary.entries()) {
          const total = types.reduce((acc, type) => acc + bucket[type], 0);
          console.log(
            `[iot-service] Daily threshold summary farm=${farmId} totalAlerts=${total} TEMP=${bucket.TEMP} HUMIDITY=${bucket.HUMIDITY} PH=${bucket.PH}`
          );
        }
      } catch (error) {
        console.error("[iot-service] Daily threshold summary failed", error);
      }
    },
    {
      timezone: env.IOT_SUMMARY_TIMEZONE
    }
  );

  console.log(`[iot-service] Daily threshold summary cron started (${env.IOT_SUMMARY_CRON})`);
};
