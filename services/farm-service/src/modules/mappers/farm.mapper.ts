import { BusinessLicense, Farm } from "@prisma/client";

export type FarmWithLicense = Farm & {
  businessLicense: BusinessLicense | null;
};

export type FarmResponse = {
  id: string;
  name: string;
  ownerId: string;
  isApproved: boolean;
  rejectReason: string | null;
  address: string | null;
  province: string | null;
  area: number | null;
  createdAt: Date;
  updatedAt: Date;
  businessLicense: {
    id: string;
    licenseNumber: string;
    issuedBy: string | null;
    issuedAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

export const mapFarmToResponse = (farm: FarmWithLicense): FarmResponse => ({
  id: farm.id,
  name: farm.name,
  ownerId: farm.ownerId,
  isApproved: farm.isApproved,
  rejectReason: farm.rejectReason ?? null,
  address: farm.address ?? null,
  province: farm.province ?? null,
  area: farm.area ?? null,
  createdAt: farm.createdAt,
  updatedAt: farm.updatedAt,
  businessLicense: farm.businessLicense
    ? {
        id: farm.businessLicense.id,
        licenseNumber: farm.businessLicense.licenseNumber,
        issuedBy: farm.businessLicense.issuedBy ?? null,
        issuedAt: farm.businessLicense.issuedAt ?? null,
        expiresAt: farm.businessLicense.expiresAt ?? null,
        createdAt: farm.businessLicense.createdAt,
        updatedAt: farm.businessLicense.updatedAt
      }
    : null
});
