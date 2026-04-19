import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const connectPrisma = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log("[iot-service] Prisma connected");
  } catch (error) {
    console.error("[iot-service] Prisma connection failed. Check DATABASE_URL and run `prisma generate`.", error);
    throw error;
  }
};

export const disconnectPrisma = async (): Promise<void> => {
  await prisma.$disconnect();
};
