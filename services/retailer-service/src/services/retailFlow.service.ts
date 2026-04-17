import { randomUUID } from "crypto";
import { Collection } from "mongodb";
import { chainAxios, reportAxios, shippingAxios } from "../config/axios.instances";
import { publishEvent } from "../config/kafka.producer.config";
import { connectMongo } from "../config/mongodb";
import { kafkaTopics } from "../constants/kafkaTopics";
import { OrderStatus } from "../constants/orderStatus";
import { AppError } from "../errors/appError";

type RetailOrderDoc = {
  _id: string;
  retailerId: string;
  farmId: string;
  shipmentId?: string;
  status: OrderStatus;
  recipientNote?: string;
  deliveryProofs?: Array<{
    originalName: string;
    mimeType: string;
    size: number;
  }>;
  deliveredAt?: Date;
  updatedAt: Date;
};

type RetailerProfileDoc = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  businessLicense?: {
    licenseNumber: string;
    issuedBy?: string;
    issuedAt?: string;
    expiresAt?: string;
    files?: Array<{
      originalName: string;
      mimeType: string;
      size: number;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
};

async function getCollections(): Promise<{
  orders: Collection<RetailOrderDoc>;
  profiles: Collection<RetailerProfileDoc>;
}> {
  const db = await connectMongo();
  return {
    orders: db.collection<RetailOrderDoc>("retail_orders"),
    profiles: db.collection<RetailerProfileDoc>("retailer_profiles")
  };
}

async function requestTraceFromBlockchain(qrCode: string): Promise<unknown> {
  const candidates = [
    () => chainAxios.post("/api/chain/trace/scan", { qrCode }),
    () => chainAxios.post("/api/chain/qr/scan", { qrCode }),
    () => chainAxios.post("/api/v1/qr/scan", { qrCode })
  ];

  for (const call of candidates) {
    try {
      const response = await call();
      return response.data;
    } catch (error: unknown) {
      const status =
        typeof error === "object" && error && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;

      if (status === 404) {
        continue;
      }

      if (status !== undefined) {
        throw new AppError("DOWNSTREAM_SERVICE_ERROR", `blockchain service returned ${status}`);
      }
    }
  }

  throw new AppError("QR_NOT_FOUND");
}

export const retailFlowService = {
  async scanQr(qrCode: string): Promise<unknown> {
    const trimmed = qrCode.trim();
    if (!trimmed) {
      throw new AppError("INVALID_REQUEST", "qrCode is required");
    }

    return requestTraceFromBlockchain(trimmed);
  },

  async confirmDelivery(
    orderId: string,
    recipientNote?: string,
    files?: Express.Multer.File[]
  ): Promise<unknown> {
    const { orders } = await getCollections();
    const order = await orders.findOne({ _id: orderId });
    if (!order) {
      throw new AppError("ORDER_NOT_FOUND");
    }

    if (order.status !== OrderStatus.SHIPPING) {
      throw new AppError("DELIVERY_CONFIRMATION_FAILED", `current status is ${order.status}`);
    }

    const now = new Date();
    const proofs =
      files?.map((file) => ({
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size
      })) ?? [];

    await orders.updateOne(
      { _id: orderId },
      {
        $set: {
          status: OrderStatus.DELIVERED,
          recipientNote: recipientNote?.trim() || undefined,
          deliveryProofs: proofs,
          deliveredAt: now,
          updatedAt: now
        }
      }
    );

    await publishEvent(kafkaTopics.ORDER_DELIVERED, {
      eventId: randomUUID(),
      eventType: "OrderDeliveredEvent",
      timestamp: now.toISOString(),
      version: "1.0",
      payload: {
        orderId: order._id,
        retailerId: order.retailerId,
        farmId: order.farmId,
        shipmentId: order.shipmentId ?? "",
        deliveredAt: now.toISOString(),
        recipientNote: recipientNote?.trim() || null,
        totalProofFiles: proofs.length
      }
    });

    return {
      id: order._id,
      status: OrderStatus.DELIVERED,
      recipientNote: recipientNote?.trim() || null,
      deliveryProofs: proofs,
      deliveredAt: now
    };
  },

  async getShipping(orderId: string): Promise<unknown> {
    try {
      const response = await shippingAxios.get(`/api/shipping/orders/${encodeURIComponent(orderId)}`);
      return response.data;
    } catch (error: unknown) {
      const status =
        typeof error === "object" && error && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;

      if (status === 404) {
        throw new AppError("ORDER_NOT_FOUND");
      }
      throw new AppError("DOWNSTREAM_SERVICE_ERROR", "shipping service unavailable");
    }
  },

  async getProfile(retailerId: string): Promise<unknown> {
    const { profiles } = await getCollections();
    const profile = await profiles.findOne({ _id: retailerId });
    if (!profile) {
      throw new AppError("PROFILE_NOT_FOUND");
    }
    return {
      id: profile._id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
      businessLicense: profile.businessLicense ?? null,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };
  },

  async upsertProfile(
    retailerId: string,
    payload: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
    }
  ): Promise<unknown> {
    const { profiles } = await getCollections();
    const now = new Date();

    await profiles.updateOne(
      { _id: retailerId },
      {
        $set: {
          ...payload,
          updatedAt: now
        },
        $setOnInsert: {
          _id: retailerId,
          createdAt: now
        }
      },
      { upsert: true }
    );

    return this.getProfile(retailerId);
  },

  async uploadProfileLicense(
    retailerId: string,
    payload: {
      licenseNumber: string;
      issuedBy?: string;
      issuedAt?: string;
      expiresAt?: string;
    },
    files?: Express.Multer.File[]
  ): Promise<unknown> {
    const { profiles } = await getCollections();
    const now = new Date();
    const fileMeta =
      files?.map((file) => ({
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size
      })) ?? [];

    await profiles.updateOne(
      { _id: retailerId },
      {
        $set: {
          businessLicense: {
            licenseNumber: payload.licenseNumber,
            issuedBy: payload.issuedBy,
            issuedAt: payload.issuedAt,
            expiresAt: payload.expiresAt,
            files: fileMeta
          },
          updatedAt: now
        },
        $setOnInsert: {
          _id: retailerId,
          createdAt: now
        }
      },
      { upsert: true }
    );

    return this.getProfile(retailerId);
  },

  async createReport(payload: Record<string, unknown>): Promise<unknown> {
    try {
      const response = await reportAxios.post("/api/reports", payload);
      return response.data;
    } catch {
      throw new AppError("DOWNSTREAM_SERVICE_ERROR", "report service unavailable");
    }
  }
};
