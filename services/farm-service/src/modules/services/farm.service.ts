import { BusinessLicense, Farm, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";
import {
  AdminFarmStatusQuery,
  CreateFarmInput,
  UpdateFarmInput,
  UploadLicenseInput
} from "../schemas/farm.schema";

type FarmWithLicense = Farm & {
  businessLicense: BusinessLicense | null;
};

const farmInclude = {
  businessLicense: true
} satisfies Prisma.FarmInclude;

const buildAdminStatusWhere = (status?: AdminFarmStatusQuery["status"]): Prisma.FarmWhereInput => {
  if (!status) {
    return {};
  }

  if (status === "APPROVED") {
    return { isApproved: true };
  }

  if (status === "REJECTED") {
    return {
      isApproved: false,
      rejectReason: { not: null }
    };
  }

  return {
    isApproved: false,
    rejectReason: null
  };
};

export const createFarm = async (ownerId: string, payload: CreateFarmInput): Promise<FarmWithLicense> =>
  prisma.farm.create({
    data: {
      ownerId,
      ...payload,
      isApproved: false,
      rejectReason: null
    },
    include: farmInclude
  }) as Promise<FarmWithLicense>;

export const getMyFarms = async (ownerId: string): Promise<FarmWithLicense[]> =>
  prisma.farm.findMany({
    where: { ownerId },
    include: farmInclude,
    orderBy: { createdAt: "desc" }
  }) as Promise<FarmWithLicense[]>;

export const updateMyFarm = async (
  farmId: string,
  ownerId: string,
  payload: UpdateFarmInput
): Promise<FarmWithLicense | null> => {
  const farm = await prisma.farm.findFirst({
    where: {
      id: farmId,
      ownerId
    }
  });

  if (!farm) {
    return null;
  }

  return prisma.farm.update({
    where: { id: farmId },
    data: payload,
    include: farmInclude
  }) as Promise<FarmWithLicense>;
};

export const upsertFarmLicense = async (
  farmId: string,
  ownerId: string,
  payload: UploadLicenseInput
): Promise<FarmWithLicense | null> => {
  const farm = await prisma.farm.findFirst({
    where: {
      id: farmId,
      ownerId
    }
  });

  if (!farm) {
    return null;
  }

  await prisma.businessLicense.upsert({
    where: {
      farmId
    },
    create: {
      farmId,
      ...payload
    },
    update: payload
  });

  return prisma.farm.findUnique({
    where: { id: farmId },
    include: farmInclude
  }) as Promise<FarmWithLicense>;
};

export const getAdminFarms = async (status?: AdminFarmStatusQuery["status"]): Promise<FarmWithLicense[]> =>
  prisma.farm.findMany({
    where: buildAdminStatusWhere(status),
    include: farmInclude,
    orderBy: { createdAt: "desc" }
  }) as Promise<FarmWithLicense[]>;

export const getAdminFarmDetail = async (farmId: string): Promise<FarmWithLicense | null> =>
  prisma.farm.findUnique({
    where: { id: farmId },
    include: farmInclude
  }) as Promise<FarmWithLicense | null>;

export const adminUpdateFarm = async (farmId: string, payload: UpdateFarmInput): Promise<FarmWithLicense | null> => {
  const existing = await prisma.farm.findUnique({
    where: { id: farmId }
  });

  if (!existing) {
    return null;
  }

  return prisma.farm.update({
    where: { id: farmId },
    data: payload,
    include: farmInclude
  }) as Promise<FarmWithLicense>;
};

export const adminDeleteFarm = async (farmId: string): Promise<boolean> => {
  const existing = await prisma.farm.findUnique({
    where: { id: farmId }
  });

  if (!existing) {
    return false;
  }

  await prisma.farm.delete({
    where: { id: farmId }
  });
  return true;
};

export const adminApproveFarm = async (farmId: string): Promise<FarmWithLicense | null> => {
  const existing = await prisma.farm.findUnique({
    where: { id: farmId }
  });

  if (!existing) {
    return null;
  }

  return prisma.farm.update({
    where: { id: farmId },
    data: {
      isApproved: true,
      rejectReason: null
    },
    include: farmInclude
  }) as Promise<FarmWithLicense>;
};

export const adminRejectFarm = async (farmId: string, rejectReason: string): Promise<FarmWithLicense | null> => {
  const existing = await prisma.farm.findUnique({
    where: { id: farmId }
  });

  if (!existing) {
    return null;
  }

  return prisma.farm.update({
    where: { id: farmId },
    data: {
      isApproved: false,
      rejectReason
    },
    include: farmInclude
  }) as Promise<FarmWithLicense>;
};
