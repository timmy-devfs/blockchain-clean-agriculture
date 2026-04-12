import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const connectPrisma = async (): Promise<void> => {
  await prisma.$connect();
  console.log("[iot-service] Prisma connected");
};

export const disconnectPrisma = async (): Promise<void> => {
  await prisma.$disconnect();
};
