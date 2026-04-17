import { randomUUID } from "crypto";
import { Collection } from "mongodb";
import { z } from "zod";
import { OrderStatus, canTransition } from "../constants/orderStatus";
import { AppError } from "../errors/appError";
import { connectMongo } from "../config/mongodb";
import { chainAxios, farmAxios } from "../config/axios.instances";

type RetailerDoc = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
};

type RetailOrderDoc = {
  _id: string;
  retailerId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  qrCode?: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
};

type OrderStatusHistoryDoc = {
  _id: string;
  orderId: string;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  changedBy?: string;
  note?: string;
  createdAt: Date;
};

export type Retailer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RetailOrder = {
  id: string;
  retailerId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  qrCode?: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
};

const createRetailerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional()
});

const createOrderSchema = z.object({
  retailerId: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
  totalAmount: z.number().positive(),
  qrCode: z.string().optional()
});

function mapRetailer(doc: RetailerDoc): Retailer {
  return {
    id: doc._id,
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    address: doc.address,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

function mapOrder(doc: RetailOrderDoc): RetailOrder {
  return {
    id: doc._id,
    retailerId: doc.retailerId,
    productName: doc.productName,
    quantity: doc.quantity,
    totalAmount: doc.totalAmount,
    qrCode: doc.qrCode,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getCollections(): Promise<{
  retailers: Collection<RetailerDoc>;
  orders: Collection<RetailOrderDoc>;
  orderStatusHistory: Collection<OrderStatusHistoryDoc>;
}> {
  const db = await connectMongo();

  return {
    retailers: db.collection<RetailerDoc>("retailers"),
    orders: db.collection<RetailOrderDoc>("retail_orders"),
    orderStatusHistory: db.collection<OrderStatusHistoryDoc>("order_status_history")
  };
}

export const retailOrderService = {
  async searchRetailers(keyword?: string): Promise<Retailer[]> {
    const { retailers } = await getCollections();

    if (!keyword?.trim()) {
      const docs = await retailers.find({}).sort({ createdAt: -1 }).toArray();
      return docs.map(mapRetailer);
    }

    const term = keyword.trim();
    const regex = new RegExp(escapeRegex(term), "i");
    const docs = await retailers
      .find({
        $or: [{ name: regex }, { email: regex }, { phone: regex }]
      })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(mapRetailer);
  },

  async createRetailer(payload: unknown): Promise<Retailer> {
    const { retailers } = await getCollections();
    const data = createRetailerSchema.parse(payload);
    const now = new Date();
    const doc: RetailerDoc = {
      _id: randomUUID(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      createdAt: now,
      updatedAt: now
    };

    await retailers.insertOne(doc);
    return mapRetailer(doc);
  },

  async createOrder(payload: unknown): Promise<RetailOrder> {
    const { retailers, orders, orderStatusHistory } = await getCollections();
    const data = createOrderSchema.parse(payload);

    const retailer = await retailers.findOne({ _id: data.retailerId });
    if (!retailer) {
      throw new AppError("RETAILER_NOT_FOUND");
    }

    try {
      await farmAxios.get("/health");
    } catch {
      throw new AppError("DOWNSTREAM_SERVICE_ERROR", "farm service is unavailable");
    }

    const now = new Date();
    const order: RetailOrderDoc = {
      _id: randomUUID(),
      retailerId: data.retailerId,
      productName: data.productName,
      quantity: data.quantity,
      totalAmount: data.totalAmount,
      qrCode: data.qrCode,
      status: OrderStatus.PENDING_PAYMENT,
      createdAt: now,
      updatedAt: now
    };
    await orders.insertOne(order);

    await orderStatusHistory.insertOne({
      _id: randomUUID(),
      orderId: order._id,
      toStatus: OrderStatus.PENDING_PAYMENT,
      createdAt: now
    });

    return mapOrder(order);
  },

  async updateOrderStatus(
    orderId: string,
    toStatus: OrderStatus,
    changedBy?: string,
    note?: string
  ): Promise<RetailOrder> {
    const { orders, orderStatusHistory } = await getCollections();
    const order = await orders.findOne({ _id: orderId });
    if (!order) {
      throw new AppError("ORDER_NOT_FOUND");
    }

    const fromStatus = order.status as OrderStatus;
    if (!canTransition(fromStatus, toStatus)) {
      throw new AppError("INVALID_ORDER_STATUS_FLOW", `${fromStatus} -> ${toStatus}`);
    }

    const updatedAt = new Date();
    await orders.updateOne(
      { _id: orderId },
      { $set: { status: toStatus, updatedAt } }
    );

    await orderStatusHistory.insertOne({
      _id: randomUUID(),
      orderId,
      fromStatus,
      toStatus,
      changedBy,
      note,
      createdAt: updatedAt
    });

    return mapOrder({ ...order, status: toStatus, updatedAt });
  },

  async scanOrderQr(orderId: string, qrCode: string): Promise<RetailOrder> {
    const { orders } = await getCollections();
    const order = await orders.findOne({ _id: orderId });
    if (!order) {
      throw new AppError("ORDER_NOT_FOUND");
    }

    if (!qrCode.trim()) {
      throw new AppError("QR_SCAN_FAILED", "empty qr code");
    }

    try {
      await chainAxios.post("/api/v1/qr/scan", { orderId, qrCode });
    } catch {
      throw new AppError("QR_SCAN_FAILED", "blockchain service rejected qr scan");
    }

    return this.updateOrderStatus(orderId, OrderStatus.CONFIRMED, "qr-scanner", "QR scan verified");
  },

  async confirmDelivery(orderId: string, changedBy?: string): Promise<RetailOrder> {
    const { orders } = await getCollections();
    const order = await orders.findOne({ _id: orderId });
    if (!order) {
      throw new AppError("ORDER_NOT_FOUND");
    }

    if (order.status !== OrderStatus.SHIPPING) {
      throw new AppError("DELIVERY_CONFIRMATION_FAILED", `current status is ${order.status}`);
    }

    return this.updateOrderStatus(orderId, OrderStatus.DELIVERED, changedBy, "Delivery confirmed");
  }
};
