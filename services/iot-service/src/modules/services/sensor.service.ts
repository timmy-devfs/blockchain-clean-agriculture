import { SensorType } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { redis } from "../../config/redis.config";
import { DashboardQueryInput, HistoryQueryInput, SensorReadingInput } from "../schemas/sensor.schema";
import { publishIoTAlert } from "./iotAlert.producer";
import { validateThreshold } from "./threshold.validator";

const HISTORY_LIMIT_24H = 288;

const buildHistoryKey = (farmId: string, sensorId: string, type: SensorType): string =>
  `iot:history:${farmId}:${sensorId}:${type}`;

const buildLatestKey = (farmId: string, type: SensorType): string => `iot:latest:${farmId}:${type}`;

const getHistoryLimitFromHours = (hours: number): number => Math.min(HISTORY_LIMIT_24H, Math.max(1, hours * 12));

type ReadingRecord = SensorReadingInput & {
  isAlert: boolean;
  thresholdRule: string | null;
  createdAt: Date;
};

export const ingestSensorBatch = async (
  input: { readings: SensorReadingInput[] }
): Promise<{
  inserted: number;
  alerts: number;
}> => {
  const now = new Date();
  const records: ReadingRecord[] = input.readings.map((reading) => {
    const threshold = validateThreshold(reading);
    return {
      ...reading,
      isAlert: threshold.isAlert,
      thresholdRule: threshold.rule,
      createdAt: now
    };
  });

  await prisma.sensorReading.createMany({
    data: records.map((record) => ({
      farmId: record.farmId,
      sensorId: record.sensorId,
      type: record.type,
      value: record.value,
      unit: record.unit,
      isAlert: record.isAlert,
      createdAt: record.createdAt
    }))
  });

  if (redis.status === "ready") {
    const pipeline = redis.pipeline();
    for (const record of records) {
      const serialized = JSON.stringify({
        farmId: record.farmId,
        sensorId: record.sensorId,
        type: record.type,
        value: record.value,
        unit: record.unit,
        isAlert: record.isAlert,
        createdAt: record.createdAt.toISOString()
      });
      pipeline.lpush(buildHistoryKey(record.farmId, record.sensorId, record.type), serialized);
      pipeline.ltrim(buildHistoryKey(record.farmId, record.sensorId, record.type), 0, HISTORY_LIMIT_24H - 1);
      pipeline.set(buildLatestKey(record.farmId, record.type), serialized);
    }
    await pipeline.exec();
  }

  const alerts = records.filter((record) => record.isAlert);
  for (const alert of alerts) {
    await publishIoTAlert({
      farmId: alert.farmId,
      sensorId: alert.sensorId,
      type: alert.type,
      value: alert.value,
      unit: alert.unit,
      rule: alert.thresholdRule ?? "Threshold exceeded",
      occurredAt: alert.createdAt.toISOString()
    });
  }

  return {
    inserted: records.length,
    alerts: alerts.length
  };
};

type LatestItem = {
  type: SensorType;
  farmId: string;
  sensorId: string;
  value: number;
  unit: string;
  isAlert: boolean;
  createdAt: string;
};

export const getLatestByFarm = async (farmId: string): Promise<LatestItem[]> => {
  const types: SensorType[] = [SensorType.TEMP, SensorType.HUMIDITY, SensorType.PH];
  const result: LatestItem[] = [];

  for (const type of types) {
    const key = buildLatestKey(farmId, type);
    const cached = redis.status === "ready" ? await redis.get(key) : null;
    if (cached) {
      result.push(JSON.parse(cached) as LatestItem);
      continue;
    }

    const latest = await prisma.sensorReading.findFirst({
      where: { farmId, type },
      orderBy: { createdAt: "desc" }
    });
    if (!latest) {
      continue;
    }

    const item: LatestItem = {
      type: latest.type,
      farmId: latest.farmId,
      sensorId: latest.sensorId,
      value: latest.value,
      unit: latest.unit,
      isAlert: latest.isAlert,
      createdAt: latest.createdAt.toISOString()
    };
    result.push(item);

    if (redis.status === "ready") {
      await redis.set(key, JSON.stringify(item));
    }
  }

  return result;
};

export const getHistory = async (query: HistoryQueryInput): Promise<{
  farmId: string;
  hours: number;
  limit: number;
  total: number;
  items: Array<{
    farmId: string;
    sensorId: string;
    type: SensorType;
    value: number;
    unit: string;
    isAlert: boolean;
    createdAt: string;
  }>;
}> => {
  const limit = getHistoryLimitFromHours(query.hours);
  const basePattern = query.type
    ? `iot:history:${query.farmId}:${query.sensorId ?? "*"}:${query.type}`
    : `iot:history:${query.farmId}:${query.sensorId ?? "*"}:*`;

  if (redis.status === "ready") {
    const keys = await redis.keys(basePattern);
    const chunks = await Promise.all(keys.map((key) => redis.lrange(key, 0, limit - 1)));
    const merged = chunks
      .flatMap((items) => items.map((item) => JSON.parse(item)))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return {
      farmId: query.farmId,
      hours: query.hours,
      limit,
      total: merged.length,
      items: merged
    };
  }

  const fromTime = new Date(Date.now() - query.hours * 60 * 60 * 1000);
  const dbItems = await prisma.sensorReading.findMany({
    where: {
      farmId: query.farmId,
      sensorId: query.sensorId,
      type: query.type,
      createdAt: { gte: fromTime }
    },
    orderBy: { createdAt: "desc" },
    take: limit
  });

  return {
    farmId: query.farmId,
    hours: query.hours,
    limit,
    total: dbItems.length,
    items: dbItems.map((item) => ({
      farmId: item.farmId,
      sensorId: item.sensorId,
      type: item.type,
      value: item.value,
      unit: item.unit,
      isAlert: item.isAlert,
      createdAt: item.createdAt.toISOString()
    }))
  };
};

export const getDashboard = async (query: DashboardQueryInput): Promise<{
  farmId: string;
  latest: LatestItem[];
  totalReadings24h: number;
  alertReadings24h: number;
}> => {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [latest, totalReadings24h, alertReadings24h] = await Promise.all([
    getLatestByFarm(query.farmId),
    prisma.sensorReading.count({
      where: {
        farmId: query.farmId,
        createdAt: { gte: since24h }
      }
    }),
    prisma.sensorReading.count({
      where: {
        farmId: query.farmId,
        createdAt: { gte: since24h },
        isAlert: true
      }
    })
  ]);

  return {
    farmId: query.farmId,
    latest,
    totalReadings24h,
    alertReadings24h
  };
};
