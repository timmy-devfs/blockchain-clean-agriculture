import { SensorType } from "@prisma/client";
import { SensorReadingInput } from "../schemas/sensor.schema";

type ThresholdResult = {
  isAlert: boolean;
  rule: string | null;
};

const formatRule = (type: SensorType, value: number, min: number, max: number): string =>
  `${type}=${value} out of range [${min}, ${max}]`;

export const validateThreshold = (reading: SensorReadingInput): ThresholdResult => {
  const value = reading.value;

  if (reading.type === SensorType.TEMP) {
    if (value < 10 || value > 40) {
      return {
        isAlert: true,
        rule: formatRule(SensorType.TEMP, value, 10, 40)
      };
    }
    return { isAlert: false, rule: null };
  }

  if (reading.type === SensorType.HUMIDITY) {
    if (value < 30 || value > 90) {
      return {
        isAlert: true,
        rule: formatRule(SensorType.HUMIDITY, value, 30, 90)
      };
    }
    return { isAlert: false, rule: null };
  }

  if (value < 5.5 || value > 8.5) {
    return {
      isAlert: true,
      rule: formatRule(SensorType.PH, value, 5.5, 8.5)
    };
  }

  return { isAlert: false, rule: null };
};
