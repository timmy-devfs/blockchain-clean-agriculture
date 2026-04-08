import { Farm, FarmingSeason, MarketplaceListing, ServicePackageSubscription } from "@prisma/client";

export type ListingWithRelations = MarketplaceListing & {
  farm: Farm;
  season: FarmingSeason;
};

export type ListingResponse = {
  id: string;
  farmId: string;
  seasonId: string;
  title: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  farm: {
    id: string;
    name: string;
    ownerId: string;
  };
  season: {
    id: string;
    cropType: string;
    status: string;
  };
};

export const mapListingToResponse = (listing: ListingWithRelations): ListingResponse => ({
  id: listing.id,
  farmId: listing.farmId,
  seasonId: listing.seasonId,
  title: listing.title,
  description: listing.description ?? null,
  quantity: listing.quantity,
  unitPrice: listing.unitPrice,
  isActive: listing.isActive,
  createdAt: listing.createdAt,
  updatedAt: listing.updatedAt,
  farm: {
    id: listing.farm.id,
    name: listing.farm.name,
    ownerId: listing.farm.ownerId
  },
  season: {
    id: listing.season.id,
    cropType: listing.season.cropType,
    status: listing.season.status
  }
});

export type PackageSubscriptionResponse = {
  id: string;
  farmId: string;
  packageName: string;
  startsAt: Date;
  endsAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const mapSubscriptionToResponse = (
  subscription: ServicePackageSubscription
): PackageSubscriptionResponse => ({
  id: subscription.id,
  farmId: subscription.farmId,
  packageName: subscription.packageName,
  startsAt: subscription.startsAt,
  endsAt: subscription.endsAt ?? null,
  isActive: subscription.isActive,
  createdAt: subscription.createdAt,
  updatedAt: subscription.updatedAt
});
