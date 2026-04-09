import { Farm, MarketplaceListing, Prisma, ServicePackageSubscription } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { ListingWithRelations, mapListingToResponse } from "../mappers/marketplace.mapper";
import {
  CreateListingInput,
  ListMyListingsQueryInput,
  SubscribePackageInput,
  UpdateListingInput
} from "../schemas/marketplace.schema";
import { evictMyListingsCache, getCachedMyListings, setCachedMyListings } from "./marketplaceCache.service";

type ListingPageResponse = {
  page: number;
  limit: number;
  total: number;
  items: ReturnType<typeof mapListingToResponse>[];
};

const listingInclude = {
  farm: true,
  season: true
} satisfies Prisma.MarketplaceListingInclude;

const packageCatalog = [
  { id: "BASIC", name: "Basic", durationDays: 30, price: 299000 },
  { id: "PRO", name: "Pro", durationDays: 90, price: 799000 },
  { id: "ENTERPRISE", name: "Enterprise", durationDays: 365, price: 2599000 }
] as const;

const getOwnedFarm = async (userId: string, farmId: string): Promise<Farm | null> =>
  prisma.farm.findFirst({
    where: {
      id: farmId,
      ownerId: userId
    }
  });

const getActiveFarmPackage = async (farmId: string): Promise<ServicePackageSubscription | null> => {
  const now = new Date();

  const subscription = await prisma.servicePackageSubscription.findFirst({
    where: {
      farmId,
      isActive: true,
      OR: [{ endsAt: null }, { endsAt: { gt: now } }]
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return subscription;
};

type CreateListingValidationResult =
  | { type: "FARM_NOT_FOUND" }
  | { type: "FARM_NOT_APPROVED" }
  | { type: "PACKAGE_EXPIRED" }
  | { type: "SEASON_NOT_FOUND" }
  | { type: "OK"; farm: Farm };

const validateListingCreation = async (
  userId: string,
  payload: CreateListingInput
): Promise<CreateListingValidationResult> => {
  const farm = await getOwnedFarm(userId, payload.farmId);
  if (!farm) {
    return { type: "FARM_NOT_FOUND" };
  }

  if (!farm.isApproved) {
    return { type: "FARM_NOT_APPROVED" };
  }

  const activePackage = await getActiveFarmPackage(payload.farmId);
  if (!activePackage) {
    return { type: "PACKAGE_EXPIRED" };
  }

  const season = await prisma.farmingSeason.findFirst({
    where: {
      id: payload.seasonId,
      farmId: payload.farmId
    }
  });

  if (!season) {
    return { type: "SEASON_NOT_FOUND" };
  }

  return { type: "OK", farm };
};

export const createListing = async (
  userId: string,
  payload: CreateListingInput
): Promise<
  | { type: "FARM_NOT_FOUND" }
  | { type: "FORBIDDEN"; reason: "FARM_NOT_APPROVED" | "PACKAGE_EXPIRED" }
  | { type: "SEASON_NOT_FOUND" }
  | { type: "CREATED"; listing: ListingWithRelations }
> => {
  const validation = await validateListingCreation(userId, payload);
  if (validation.type === "FARM_NOT_FOUND") {
    return validation;
  }
  if (validation.type === "FARM_NOT_APPROVED") {
    return { type: "FORBIDDEN", reason: "FARM_NOT_APPROVED" };
  }
  if (validation.type === "PACKAGE_EXPIRED") {
    return { type: "FORBIDDEN", reason: "PACKAGE_EXPIRED" };
  }
  if (validation.type === "SEASON_NOT_FOUND") {
    return validation;
  }

  const listing = (await prisma.marketplaceListing.create({
    data: {
      farmId: payload.farmId,
      seasonId: payload.seasonId,
      title: payload.title,
      description: payload.description,
      quantity: payload.quantity,
      unitPrice: payload.unitPrice,
      isActive: true
    },
    include: listingInclude
  })) as ListingWithRelations;

  await evictMyListingsCache(userId);
  return { type: "CREATED", listing };
};

export const getMyListings = async (userId: string, query: ListMyListingsQueryInput): Promise<ListingPageResponse> => {
  const cached = await getCachedMyListings<ListingPageResponse>(userId, query);
  if (cached) {
    return cached;
  }

  const where: Prisma.MarketplaceListingWhereInput = {
    isActive: true,
    farm: {
      ownerId: userId
    },
    farmId: query.farmId,
    seasonId: query.seasonId,
    OR: query.keyword
      ? [
          {
            title: {
              contains: query.keyword,
              mode: "insensitive"
            }
          },
          {
            description: {
              contains: query.keyword,
              mode: "insensitive"
            }
          }
        ]
      : undefined
  };

  const skip = (query.page - 1) * query.limit;
  const [total, listings] = await Promise.all([
    prisma.marketplaceListing.count({ where }),
    prisma.marketplaceListing.findMany({
      where,
      include: listingInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit
    })
  ]);

  const response: ListingPageResponse = {
    page: query.page,
    limit: query.limit,
    total,
    items: (listings as ListingWithRelations[]).map(mapListingToResponse)
  };

  await setCachedMyListings(userId, query, response);
  return response;
};

export const updateListing = async (
  userId: string,
  listingId: string,
  payload: UpdateListingInput
): Promise<ListingWithRelations | null> => {
  const existing = await prisma.marketplaceListing.findFirst({
    where: {
      id: listingId,
      isActive: true,
      farm: {
        ownerId: userId
      }
    }
  });

  if (!existing) {
    return null;
  }

  const updated = (await prisma.marketplaceListing.update({
    where: { id: listingId },
    data: payload,
    include: listingInclude
  })) as ListingWithRelations;

  await evictMyListingsCache(userId);
  return updated;
};

export const deleteListing = async (userId: string, listingId: string): Promise<boolean> => {
  const existing = await prisma.marketplaceListing.findFirst({
    where: {
      id: listingId,
      isActive: true,
      farm: {
        ownerId: userId
      }
    }
  });

  if (!existing) {
    return false;
  }

  await prisma.marketplaceListing.update({
    where: { id: listingId },
    data: { isActive: false }
  });

  await evictMyListingsCache(userId);
  return true;
};

export const getAvailablePackages = () =>
  packageCatalog.map((pkg) => ({
    ...pkg,
    currency: "VND"
  }));

export const subscribePackage = async (
  userId: string,
  packageId: string,
  payload: SubscribePackageInput
): Promise<
  | { type: "FARM_NOT_FOUND" }
  | { type: "FARM_NOT_APPROVED" }
  | { type: "PACKAGE_NOT_FOUND" }
  | { type: "SUBSCRIBED"; subscription: ServicePackageSubscription; paymentUrl: string }
> => {
  const farm = await getOwnedFarm(userId, payload.farmId);
  if (!farm) {
    return { type: "FARM_NOT_FOUND" };
  }

  if (!farm.isApproved) {
    return { type: "FARM_NOT_APPROVED" };
  }

  const selectedPackage = packageCatalog.find((item) => item.id === packageId.toUpperCase());
  if (!selectedPackage) {
    return { type: "PACKAGE_NOT_FOUND" };
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + selectedPackage.durationDays * 24 * 60 * 60 * 1000);

  const subscription = await prisma.$transaction(async (tx) => {
    await tx.servicePackageSubscription.updateMany({
      where: {
        farmId: payload.farmId,
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    return tx.servicePackageSubscription.create({
      data: {
        farmId: payload.farmId,
        packageName: selectedPackage.name,
        startsAt: now,
        endsAt,
        isActive: true
      }
    });
  });

  const paymentUrl =
    `https://payment-service.local/api/payment/checkout?farmId=${payload.farmId}` +
    `&packageId=${selectedPackage.id}&amount=${selectedPackage.price}`;

  return { type: "SUBSCRIBED", subscription, paymentUrl };
};

export const getMyCurrentPackage = async (
  userId: string,
  farmId: string
): Promise<
  | { type: "FARM_NOT_FOUND" }
  | { type: "NO_ACTIVE_PACKAGE" }
  | {
      type: "FOUND";
      subscription: ServicePackageSubscription;
      expiryDate: Date | null;
      countdownSeconds: number | null;
    }
> => {
  const farm = await getOwnedFarm(userId, farmId);
  if (!farm) {
    return { type: "FARM_NOT_FOUND" };
  }

  const subscription = await getActiveFarmPackage(farmId);
  if (!subscription) {
    return { type: "NO_ACTIVE_PACKAGE" };
  }

  const expiryDate = subscription.endsAt ?? null;
  const countdownSeconds = expiryDate
    ? Math.max(0, Math.floor((expiryDate.getTime() - Date.now()) / 1000))
    : null;

  return {
    type: "FOUND",
    subscription,
    expiryDate,
    countdownSeconds
  };
};
