import { OrderStatus, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "../../database/prisma";
import { FarmOrderWithRelations, mapOrderToResponse } from "../mappers/order.mapper";
import { ListOrdersQueryInput } from "../schemas/order.schema";
import { publishFarmEvent } from "./farmEventProducer";

const orderInclude = {
  farm: true,
  season: true,
  listing: true
} satisfies Prisma.FarmOrderInclude;

const orderPlacedEventSchema = z.object({
  orderId: z.string().trim().min(1),
  farmId: z.string().trim().min(1),
  seasonId: z.string().trim().min(1),
  listingId: z.string().trim().min(1),
  retailerId: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
  totalAmount: z.coerce.number().positive(),
  deliveryAddress: z.string().trim().min(1).optional()
});

export type OrderPlacedEventInput = z.infer<typeof orderPlacedEventSchema>;

export const parseOrderPlacedEvent = (raw: unknown): OrderPlacedEventInput => {
  if (typeof raw === "object" && raw !== null && "payload" in raw) {
    return orderPlacedEventSchema.parse((raw as { payload: unknown }).payload);
  }

  return orderPlacedEventSchema.parse(raw);
};

export const createOrderFromPlacedEvent = async (payload: OrderPlacedEventInput): Promise<void> => {
  const existing = await prisma.farmOrder.findFirst({
    where: {
      externalOrderId: payload.orderId
    }
  });

  if (existing) {
    return;
  }

  try {
    await prisma.farmOrder.create({
      data: {
        externalOrderId: payload.orderId,
        farmId: payload.farmId,
        seasonId: payload.seasonId,
        listingId: payload.listingId,
        retailerId: payload.retailerId,
        quantity: payload.quantity,
        totalAmount: payload.totalAmount,
        status: OrderStatus.PENDING,
        rejectReason: null,
        deliveryAddress: payload.deliveryAddress
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return;
    }
    throw error;
  }
};

export const getMyOrders = async (
  userId: string,
  query: ListOrdersQueryInput
): Promise<{
  page: number;
  limit: number;
  total: number;
  items: ReturnType<typeof mapOrderToResponse>[];
}> => {
  const where: Prisma.FarmOrderWhereInput = {
    farm: {
      ownerId: userId
    },
    status: query.status
  };

  const skip = (query.page - 1) * query.limit;
  const [total, orders] = await Promise.all([
    prisma.farmOrder.count({ where }),
    prisma.farmOrder.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit
    })
  ]);

  return {
    page: query.page,
    limit: query.limit,
    total,
    items: (orders as FarmOrderWithRelations[]).map(mapOrderToResponse)
  };
};

export type ConfirmOrderResult =
  | { type: "NOT_FOUND" }
  | { type: "INVALID_STATUS"; currentStatus: OrderStatus; errorCode: number; message: string }
  | { type: "CONFIRMED"; order: FarmOrderWithRelations };

export const confirmOrder = async (userId: string, orderId: string): Promise<ConfirmOrderResult> => {
  const existing = (await prisma.farmOrder.findFirst({
    where: {
      id: orderId,
      farm: {
        ownerId: userId
      }
    },
    include: orderInclude
  })) as FarmOrderWithRelations | null;

  if (!existing) {
    return { type: "NOT_FOUND" };
  }

  if (existing.status === OrderStatus.CONFIRMED) {
    return {
      type: "INVALID_STATUS",
      currentStatus: existing.status,
      errorCode: 2002,
      message: "Order already confirmed"
    };
  }

  if (existing.status !== OrderStatus.PENDING) {
    return {
      type: "INVALID_STATUS",
      currentStatus: existing.status,
      errorCode: 2001,
      message: "Only pending order can be confirmed"
    };
  }

  const confirmed = (await prisma.farmOrder.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.CONFIRMED,
      confirmedAt: new Date(),
      rejectReason: null
    },
    include: orderInclude
  })) as FarmOrderWithRelations;

  await publishFarmEvent("orderConfirmed", {
    eventId: randomUUID(),
    eventType: "OrderConfirmedEvent",
    timestamp: new Date().toISOString(),
    payload: {
      orderId: confirmed.externalOrderId,
      farmOrderId: confirmed.id,
      farmId: confirmed.farmId,
      retailerId: confirmed.retailerId,
      confirmedAt: confirmed.confirmedAt?.toISOString() ?? null
    }
  });

  return { type: "CONFIRMED", order: confirmed };
};

export type RejectOrderResult =
  | { type: "NOT_FOUND" }
  | { type: "INVALID_STATUS"; currentStatus: OrderStatus; errorCode: number; message: string }
  | { type: "REJECTED"; order: FarmOrderWithRelations };

export const rejectOrder = async (userId: string, orderId: string, rejectReason: string): Promise<RejectOrderResult> => {
  const existing = (await prisma.farmOrder.findFirst({
    where: {
      id: orderId,
      farm: {
        ownerId: userId
      }
    },
    include: orderInclude
  })) as FarmOrderWithRelations | null;

  if (!existing) {
    return { type: "NOT_FOUND" };
  }

  if (existing.status === OrderStatus.CONFIRMED) {
    return {
      type: "INVALID_STATUS",
      currentStatus: existing.status,
      errorCode: 2003,
      message: "Confirmed order cannot be rejected"
    };
  }

  if (existing.status === OrderStatus.REJECTED) {
    return {
      type: "INVALID_STATUS",
      currentStatus: existing.status,
      errorCode: 2004,
      message: "Order already rejected"
    };
  }

  if (existing.status !== OrderStatus.PENDING) {
    return {
      type: "INVALID_STATUS",
      currentStatus: existing.status,
      errorCode: 2005,
      message: "Only pending order can be rejected"
    };
  }

  const rejected = (await prisma.farmOrder.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.REJECTED,
      rejectReason,
      confirmedAt: null
    },
    include: orderInclude
  })) as FarmOrderWithRelations;

  return { type: "REJECTED", order: rejected };
};
