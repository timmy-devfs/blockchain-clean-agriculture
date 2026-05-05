import { Farm, FarmingSeason, Prisma, SeasonStatus, SeasonUpdate } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "../../database/prisma";
import { mapSeasonToListItem } from "../mappers/season.mapper";
import {
  CreateSeasonInput,
  CreateSeasonUpdateInput,
  ListSeasonsQueryInput,
  UpdateSeasonInput
} from "../schemas/season.schema";
import { evictSeasonListCache, getCachedSeasonList, setCachedSeasonList } from "./seasonCache.service";
import { publishFarmEvent } from "./farmEventProducer";

type SeasonWithFarm = FarmingSeason & {
  farm: Farm;
};

type SeasonDetail = SeasonWithFarm & {
  seasonUpdates: SeasonUpdate[];
};

const ADMIN_CHAIN_APPROVAL_NOTE = "ADMIN_APPROVED_FOR_BLOCKCHAIN";

const seasonWithFarmInclude = {
  farm: true
} satisfies Prisma.FarmingSeasonInclude;

const seasonDetailInclude = {
  farm: true,
  seasonUpdates: {
    orderBy: {
      updatedAt: "desc"
    }
  }
} satisfies Prisma.FarmingSeasonInclude;

const buildEventEnvelope = <T>(eventType: string, payload: T) => ({
  eventId: randomUUID(),
  eventType,
  timestamp: new Date().toISOString(),
  payload
});

export type CreateSeasonResult =
  | { type: "NOT_FOUND" }
  | { type: "FARM_NOT_APPROVED" }
  | { type: "CREATED"; season: SeasonWithFarm };

export const createSeason = async (userId: string, payload: CreateSeasonInput): Promise<CreateSeasonResult> => {
  const ownedFarm = await prisma.farm.findFirst({
    where: {
      id: payload.farmId,
      ownerId: userId
    }
  });

  if (!ownedFarm) {
    return { type: "NOT_FOUND" };
  }

  if (!ownedFarm.isApproved) {
    return { type: "FARM_NOT_APPROVED" };
  }

  const season = (await prisma.farmingSeason.create({
    data: {
      farmId: payload.farmId,
      productCategoryId: payload.productCategoryId,
      cropType: payload.cropType,
      startDate: payload.startDate,
      estimatedEndDate: payload.estimatedEndDate,
      status: SeasonStatus.PREPARING
    },
    include: seasonWithFarmInclude
  })) as SeasonWithFarm;

  await evictSeasonListCache(userId);
  return { type: "CREATED", season };
};

export const getSeasons = async (
  userId: string,
  query: ListSeasonsQueryInput
): Promise<{
  page: number;
  limit: number;
  total: number;
  items: ReturnType<typeof mapSeasonToListItem>[];
}> => {
  const cached = await getCachedSeasonList<{
    page: number;
    limit: number;
    total: number;
    items: ReturnType<typeof mapSeasonToListItem>[];
  }>(userId, query);
  if (cached) {
    return cached;
  }

  const where: Prisma.FarmingSeasonWhereInput = {
    farm: {
      ownerId: userId
    },
    farmId: query.farmId,
    status: query.status,
    cropType: query.cropType
      ? {
          contains: query.cropType,
          mode: "insensitive"
        }
      : undefined
  };

  const skip = (query.page - 1) * query.limit;
  const [total, seasons] = await Promise.all([
    prisma.farmingSeason.count({ where }),
    prisma.farmingSeason.findMany({
      where,
      include: seasonWithFarmInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit
    })
  ]);

  const response = {
    page: query.page,
    limit: query.limit,
    total,
    items: (seasons as SeasonWithFarm[]).map(mapSeasonToListItem)
  };

  await setCachedSeasonList(userId, query, response);
  return response;
};

export const getSeasonDetail = async (seasonId: string, userId: string): Promise<SeasonDetail | null> =>
  prisma.farmingSeason.findFirst({
    where: {
      id: seasonId,
      farm: {
        ownerId: userId
      }
    },
    include: seasonDetailInclude
  }) as Promise<SeasonDetail | null>;

export type ApplySeasonBlockchainResult = { type: "OK" } | { type: "NOT_FOUND" };

/** Gọi từ blockchain-service (X-Internal-Key), không qua gateway. */
export const applySeasonBlockchainRecord = async (
  seasonId: string,
  data: { txHash: string; confirmedAt: Date }
): Promise<ApplySeasonBlockchainResult> => {
  const existing = await prisma.farmingSeason.findFirst({
    where: { id: seasonId },
    include: { farm: true }
  });

  if (!existing) {
    return { type: "NOT_FOUND" };
  }

  await prisma.farmingSeason.update({
    where: { id: seasonId },
    data: {
      txHash: data.txHash,
      blockchainConfirmedAt: data.confirmedAt
    }
  });

  await evictSeasonListCache(existing.farm.ownerId);
  return { type: "OK" };
};

export const updateSeason = async (
  seasonId: string,
  userId: string,
  payload: UpdateSeasonInput
): Promise<SeasonWithFarm | null> => {
  const existing = await prisma.farmingSeason.findFirst({
    where: {
      id: seasonId,
      farm: {
        ownerId: userId
      }
    }
  });

  if (!existing) {
    return null;
  }

  const updated = (await prisma.farmingSeason.update({
    where: {
      id: seasonId
    },
    data: payload,
    include: seasonWithFarmInclude
  })) as SeasonWithFarm;

  await evictSeasonListCache(userId);
  await publishFarmEvent(
    "seasonUpdated",
    buildEventEnvelope("SeasonUpdatedEvent", {
      season: mapSeasonToListItem(updated)
    })
  );

  return updated;
};

export const createSeasonUpdate = async (
  seasonId: string,
  userId: string,
  payload: CreateSeasonUpdateInput
): Promise<SeasonDetail | null> => {
  const season = await prisma.farmingSeason.findFirst({
    where: {
      id: seasonId,
      farm: {
        ownerId: userId
      }
    }
  });

  if (!season) {
    return null;
  }

  await prisma.$transaction([
    prisma.seasonUpdate.create({
      data: {
        seasonId,
        status: payload.status,
        note: payload.note,
        imageUrls: payload.imageUrls,
        updatedBy: userId
      }
    }),
    prisma.farmingSeason.update({
      where: { id: seasonId },
      data: { status: payload.status }
    })
  ]);

  await evictSeasonListCache(userId);
  return getSeasonDetail(seasonId, userId);
};

export type ExportSeasonResult =
  | { type: "NOT_FOUND" }
  | { type: "INVALID_STATUS"; currentStatus: SeasonStatus }
  | { type: "EXPORTED"; season: SeasonWithFarm };

export const exportSeason = async (seasonId: string, userId: string): Promise<ExportSeasonResult> => {
  const season = await prisma.farmingSeason.findFirst({
    where: {
      id: seasonId,
      farm: {
        ownerId: userId
      }
    },
    include: seasonWithFarmInclude
  });

  if (!season) {
    return { type: "NOT_FOUND" };
  }

  if (season.status !== SeasonStatus.HARVESTED) {
    return { type: "INVALID_STATUS", currentStatus: season.status as SeasonStatus };
  }

  const exportedSeason = (await prisma.farmingSeason.update({
    where: { id: seasonId },
    data: { status: SeasonStatus.EXPORTED },
    include: seasonWithFarmInclude
  })) as SeasonWithFarm;

  await prisma.seasonUpdate.create({
    data: {
      seasonId,
      status: SeasonStatus.EXPORTED,
      note: "Season exported",
      updatedBy: userId
    }
  });

  await evictSeasonListCache(userId);
  await publishFarmEvent(
    "seasonExported",
    buildEventEnvelope("SeasonExportedEvent", {
      season: mapSeasonToListItem(exportedSeason)
    })
  );

  return { type: "EXPORTED", season: exportedSeason };
};

export type AdminSeasonOnChainFilter = "all" | "pending" | "confirmed";

export const getAdminSeasons = async (onChain: AdminSeasonOnChainFilter): Promise<SeasonWithFarm[]> => {
  const where: Prisma.FarmingSeasonWhereInput = {};
  if (onChain === "pending") {
    where.txHash = null;
  } else if (onChain === "confirmed") {
    where.txHash = { not: null };
  }

  return prisma.farmingSeason.findMany({
    where,
    include: seasonWithFarmInclude,
    orderBy: { createdAt: "desc" }
  }) as Promise<SeasonWithFarm[]>;
};

export type AdminApproveSeasonResult =
  | { type: "NOT_FOUND" }
  | { type: "FARM_NOT_APPROVED" }
  | { type: "ALREADY_PUBLISHED" }
  | { type: "APPROVED"; season: SeasonWithFarm };

export const adminApproveSeasonForBlockchain = async (
  seasonId: string,
  adminUserId: string
): Promise<AdminApproveSeasonResult> => {
  const season = await prisma.farmingSeason.findUnique({
    where: { id: seasonId },
    include: seasonWithFarmInclude
  }) as SeasonWithFarm | null;

  if (!season) {
    return { type: "NOT_FOUND" };
  }

  if (!season.farm.isApproved) {
    return { type: "FARM_NOT_APPROVED" };
  }

  if (season.txHash) {
    return { type: "ALREADY_PUBLISHED" };
  }

  const alreadyApproved = await prisma.seasonUpdate.findFirst({
    where: {
      seasonId,
      note: ADMIN_CHAIN_APPROVAL_NOTE
    }
  });
  if (alreadyApproved) {
    return { type: "ALREADY_PUBLISHED" };
  }

  await prisma.seasonUpdate.create({
    data: {
      seasonId,
      status: season.status,
      note: ADMIN_CHAIN_APPROVAL_NOTE,
      updatedBy: `ADMIN:${adminUserId}`
    }
  });

  // blockchain-service SeasonCreatedConsumer expects SEASON_CREATED + flat payload.
  await publishFarmEvent("seasonCreated", {
    eventId: randomUUID(),
    eventType: "SEASON_CREATED",
    timestamp: new Date().toISOString(),
    version: "1.0",
    payload: {
      seasonId: season.id,
      farmId: season.farmId,
      farmName: season.farm.name,
      cropType: season.cropType,
      startDate: season.startDate.toISOString().slice(0, 10),
      estimatedEndDate: season.estimatedEndDate?.toISOString().slice(0, 10),
      area: season.farm.area ?? undefined,
      province: season.farm.province ?? "",
      status: "PREPARING" as const,
      description: ""
    }
  });

  return { type: "APPROVED", season };
};
