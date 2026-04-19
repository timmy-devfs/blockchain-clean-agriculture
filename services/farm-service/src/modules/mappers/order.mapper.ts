import { Farm, FarmingSeason, FarmOrder, MarketplaceListing } from "@prisma/client";

export type FarmOrderWithRelations = FarmOrder & {
  farm: Farm;
  season: FarmingSeason;
  listing: MarketplaceListing;
};

export const mapOrderToResponse = (order: FarmOrderWithRelations) => ({
  id: order.id,
  externalOrderId: order.externalOrderId,
  farmId: order.farmId,
  seasonId: order.seasonId,
  listingId: order.listingId,
  retailerId: order.retailerId,
  quantity: order.quantity,
  totalAmount: order.totalAmount,
  status: order.status,
  rejectReason: order.rejectReason ?? null,
  deliveryAddress: order.deliveryAddress ?? null,
  confirmedAt: order.confirmedAt ?? null,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  farm: {
    id: order.farm.id,
    name: order.farm.name,
    ownerId: order.farm.ownerId
  },
  season: {
    id: order.season.id,
    cropType: order.season.cropType,
    status: order.season.status
  },
  listing: {
    id: order.listing.id,
    title: order.listing.title
  }
});
