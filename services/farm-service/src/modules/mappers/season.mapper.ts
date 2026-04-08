import { Farm, FarmingSeason, SeasonUpdate } from "@prisma/client";

type SeasonWithFarm = FarmingSeason & {
  farm: Farm;
};

type SeasonDetail = SeasonWithFarm & {
  seasonUpdates: SeasonUpdate[];
};

export type SeasonListItemResponse = {
  id: string;
  farmId: string;
  cropType: string;
  productCategoryId: string | null;
  startDate: Date;
  estimatedEndDate: Date | null;
  status: string;
  totalYield: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SeasonDetailResponse = SeasonListItemResponse & {
  txHash: string | null;
  farm: {
    id: string;
    name: string;
    ownerId: string;
  };
  updates: Array<{
    id: string;
    status: string;
    note: string | null;
    imageUrls: unknown;
    updatedBy: string;
    updatedAt: Date;
  }>;
};

export const mapSeasonToListItem = (season: SeasonWithFarm): SeasonListItemResponse => ({
  id: season.id,
  farmId: season.farmId,
  cropType: season.cropType,
  productCategoryId: season.productCategoryId ?? null,
  startDate: season.startDate,
  estimatedEndDate: season.estimatedEndDate ?? null,
  status: season.status,
  totalYield: season.totalYield ?? null,
  createdAt: season.createdAt,
  updatedAt: season.updatedAt
});

export const mapSeasonToDetail = (season: SeasonDetail): SeasonDetailResponse => ({
  ...mapSeasonToListItem(season),
  txHash: null,
  farm: {
    id: season.farm.id,
    name: season.farm.name,
    ownerId: season.farm.ownerId
  },
  updates: season.seasonUpdates.map((update) => ({
    id: update.id,
    status: update.status,
    note: update.note ?? null,
    imageUrls: update.imageUrls ?? null,
    updatedBy: update.updatedBy,
    updatedAt: update.updatedAt
  }))
});
