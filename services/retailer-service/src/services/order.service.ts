import { randomUUID } from "crypto";
import { Collection, Filter } from "mongodb";
import { z } from "zod";
import { OrderStatus, canTransition } from "../constants/orderStatus";
import { kafkaTopics } from "../constants/kafkaTopics";
import { connectMongo } from "../config/mongodb";
import { paymentAxios } from "../config/axios.instances";
import { AppError } from "../errors/appError";
import { publishEvent } from "../config/kafka.producer.config";

type PaymentGateway = "VNPAY" | "MOMO";

type RetailerDoc = {
  _id: string;
};

type RetailOrderDoc = {
  _id: string;
  retailerId: string;
  farmId: string;
  listingId: string;
  productName: string;
  quantity: number;
  unit?: string;
  totalAmount: number;
  depositAmount: number;
  deliveryAddress?: string;
  note?: string;
  paymentGateway: PaymentGateway;
  paymentUrl?: string;
  paymentId?: string;
  transactionId?: string;
  shipmentId?: string;
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

type CreateOrderPayload = z.infer<typeof createOrderSchema>;

export type RetailOrder = {
  id: string;
  retailerId: string;
  farmId: string;
  listingId: string;
  productName: string;
  quantity: number;
  unit?: string;
  totalAmount: number;
  depositAmount: number;
  deliveryAddress?: string;
  note?: string;
  paymentGateway: PaymentGateway;
  paymentUrl?: string;
  paymentId?: string;
  transactionId?: string;
  shipmentId?: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderStatusHistory = {
  id: string;
  orderId: string;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  changedBy?: string;
  note?: string;
  createdAt: Date;
};

type PaymentSuccessPayload = {
  orderId: string;
  paymentId?: string;
  transactionId?: string;
  amount?: number;
};

const createOrderSchema = z.object({
  retailerId: z.string().min(1),
  farmId: z.string().min(1),
  listingId: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().optional(),
  totalAmount: z.number().positive(),
  depositAmount: z.number().positive(),
  deliveryAddress: z.string().optional(),
  note: z.string().optional(),
  gateway: z.enum(["VNPAY", "MOMO"]).default("VNPAY")
});

const listOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional()
});

const paymentCallbackSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1).optional(),
  transactionId: z.string().min(1).optional(),
  amount: z.number().positive().optional()
});

function mapOrder(doc: RetailOrderDoc): RetailOrder {
  return {
    id: doc._id,
    retailerId: doc.retailerId,
    farmId: doc.farmId,
    listingId: doc.listingId,
    productName: doc.productName,
    quantity: doc.quantity,
    unit: doc.unit,
    totalAmount: doc.totalAmount,
    depositAmount: doc.depositAmount,
    deliveryAddress: doc.deliveryAddress,
    note: doc.note,
    paymentGateway: doc.paymentGateway,
    paymentUrl: doc.paymentUrl,
    paymentId: doc.paymentId,
    transactionId: doc.transactionId,
    shipmentId: doc.shipmentId,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

function mapHistory(doc: OrderStatusHistoryDoc): OrderStatusHistory {
  return {
    id: doc._id,
    orderId: doc.orderId,
    fromStatus: doc.fromStatus,
    toStatus: doc.toStatus,
    changedBy: doc.changedBy,
    note: doc.note,
    createdAt: doc.createdAt
  };
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

async function appendHistory(
  orderStatusHistory: Collection<OrderStatusHistoryDoc>,
  orderId: string,
  toStatus: OrderStatus,
  fromStatus?: OrderStatus,
  changedBy?: string,
  note?: string,
  at?: Date
): Promise<void> {
  await orderStatusHistory.insertOne({
    _id: randomUUID(),
    orderId,
    fromStatus,
    toStatus,
    changedBy,
    note,
    createdAt: at ?? new Date()
  });
}

async function moveStatus(
  orderId: string,
  toStatus: OrderStatus,
  changedBy?: string,
  note?: string,
  extraSet?: Partial<RetailOrderDoc>
): Promise<RetailOrder> {
  const { orders, orderStatusHistory } = await getCollections();
  const order = await orders.findOne({ _id: orderId });
  if (!order) {
    throw new AppError("ORDER_NOT_FOUND");
  }

  if (!canTransition(order.status, toStatus)) {
    throw new AppError("INVALID_ORDER_STATUS_FLOW", `${order.status} -> ${toStatus}`);
  }

  const updatedAt = new Date();
  await orders.updateOne(
    { _id: orderId },
    {
      $set: {
        status: toStatus,
        updatedAt,
        ...(extraSet ?? {})
      }
    }
  );

  await appendHistory(orderStatusHistory, orderId, toStatus, order.status, changedBy, note, updatedAt);
  return mapOrder({ ...order, status: toStatus, updatedAt, ...(extraSet ?? {}) });
}

async function publishOrderPlaced(order: RetailOrder): Promise<void> {
  await publishEvent(kafkaTopics.ORDER_PLACED, {
    eventId: randomUUID(),
    eventType: "ORDER_PLACED",
    timestamp: new Date().toISOString(),
    version: "1.0",
    payload: {
      orderId: order.id,
      retailerId: order.retailerId,
      farmId: order.farmId,
      listingId: order.listingId,
      quantity: order.quantity,
      unit: order.unit,
      depositAmount: order.depositAmount,
      totalAmount: order.totalAmount,
      deliveryAddress: order.deliveryAddress,
      note: order.note,
      placedAt: new Date().toISOString()
    }
  });
}

async function publishOrderDelivered(order: RetailOrder): Promise<void> {
  await publishEvent(kafkaTopics.ORDER_DELIVERED, {
    eventId: randomUUID(),
    eventType: "ORDER_DELIVERED",
    timestamp: new Date().toISOString(),
    version: "1.0",
    payload: {
      orderId: order.id,
      retailerId: order.retailerId,
      farmId: order.farmId,
      shipmentId: order.shipmentId ?? "",
      deliveredAt: new Date().toISOString()
    }
  });
}

export const orderService = {
  async createOrder(payload: unknown): Promise<{ order: RetailOrder; paymentUrl: string }> {
    const { retailers, orders, orderStatusHistory } = await getCollections();
    const data = createOrderSchema.parse(payload);

    const retailer = await retailers.findOne({ _id: data.retailerId });
    if (!retailer) {
      throw new AppError("RETAILER_NOT_FOUND");
    }

    const now = new Date();
    const orderId = randomUUID();

    let paymentUrl = "";
    try {
      const paymentRes = await paymentAxios.post("/api/pay/payments", {
        orderId,
        amount: data.depositAmount,
        gateway: data.gateway,
        type: "DEPOSIT"
      });
      paymentUrl = String(paymentRes.data?.paymentUrl ?? "");
      if (!paymentUrl) {
        throw new AppError("PAYMENT_SERVICE_ERROR", "paymentUrl is missing");
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("PAYMENT_SERVICE_ERROR", "cannot create deposit payment");
    }

    const orderDoc: RetailOrderDoc = {
      _id: orderId,
      retailerId: data.retailerId,
      farmId: data.farmId,
      listingId: data.listingId,
      productName: data.productName,
      quantity: data.quantity,
      unit: data.unit,
      totalAmount: data.totalAmount,
      depositAmount: data.depositAmount,
      deliveryAddress: data.deliveryAddress,
      note: data.note,
      paymentGateway: data.gateway,
      paymentUrl,
      status: OrderStatus.PENDING_PAYMENT,
      createdAt: now,
      updatedAt: now
    };

    await orders.insertOne(orderDoc);
    await appendHistory(orderStatusHistory, orderId, OrderStatus.PENDING_PAYMENT, undefined, "system");

    return { order: mapOrder(orderDoc), paymentUrl };
  },

  async handlePaymentCallback(payload: unknown): Promise<RetailOrder> {
    const data = paymentCallbackSchema.parse(payload);
    return this.markPaymentSuccess({
      orderId: data.orderId,
      paymentId: data.paymentId,
      transactionId: data.transactionId,
      amount: data.amount
    });
  },

  async markPaymentSuccess(payload: PaymentSuccessPayload): Promise<RetailOrder> {
    const { orders } = await getCollections();
    const order = await orders.findOne({ _id: payload.orderId });
    if (!order) {
      throw new AppError("ORDER_NOT_FOUND");
    }

    if (order.status === OrderStatus.PLACED) {
      return mapOrder(order);
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new AppError("INVALID_ORDER_STATUS_FLOW", `${order.status} -> ${OrderStatus.PLACED}`);
    }

    if (payload.amount !== undefined && payload.amount < order.depositAmount) {
      throw new AppError("PAYMENT_SERVICE_ERROR", "deposit payment amount is lower than expected");
    }

    const placed = await moveStatus(
      order._id,
      OrderStatus.PLACED,
      "payment-callback",
      "Deposit payment succeeded",
      {
        paymentId: payload.paymentId ?? order.paymentId,
        transactionId: payload.transactionId ?? order.transactionId
      }
    );
    await publishOrderPlaced(placed);
    return placed;
  },

  async listOrders(queryPayload: unknown): Promise<RetailOrder[]> {
    const { orders } = await getCollections();
    const query = listOrdersQuerySchema.parse(queryPayload);
    const filter: Filter<RetailOrderDoc> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.fromDate || query.toDate) {
      filter.createdAt = {};
      if (query.fromDate) {
        filter.createdAt.$gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        filter.createdAt.$lte = new Date(query.toDate);
      }
    }

    const docs = await orders.find(filter).sort({ createdAt: -1 }).toArray();
    return docs.map(mapOrder);
  },

  async getOrderById(orderId: string): Promise<{ order: RetailOrder; statusHistory: OrderStatusHistory[] }> {
    const { orders, orderStatusHistory } = await getCollections();
    const id = z.string().trim().min(1).parse(orderId);

    const doc = await orders.findOne({ _id: id });
    if (!doc) {
      throw new AppError("ORDER_NOT_FOUND");
    }

    const historyDocs = await orderStatusHistory.find({ orderId: id }).sort({ createdAt: 1 }).toArray();
    return {
      order: mapOrder(doc),
      statusHistory: historyDocs.map(mapHistory)
    };
  },

  async cancelOrder(orderId: string): Promise<RetailOrder> {
    const { orders } = await getCollections();
    const id = z.string().trim().min(1).parse(orderId);
    const order = await orders.findOne({ _id: id });
    if (!order) {
      throw new AppError("ORDER_NOT_FOUND");
    }

    if (order.status !== OrderStatus.PLACED) {
      throw new AppError("ORDER_CANCELLATION_NOT_ALLOWED", `current status is ${order.status}`);
    }

    try {
      await paymentAxios.post("/api/pay/payments/refund", {
        orderId: id,
        amount: order.depositAmount,
        reason: "Retailer cancelled order"
      });
    } catch {
      throw new AppError("PAYMENT_SERVICE_ERROR", "refund request failed");
    }

    return moveStatus(
      id,
      OrderStatus.CANCELLED,
      "retailer",
      "Order cancelled and deposit refund requested"
    );
  },

  async handleOrderConfirmedEvent(payload: unknown): Promise<RetailOrder> {
    const schema = z.object({
      payload: z.object({
        orderId: z.string().min(1)
      })
    });
    const parsed = schema.parse(payload);
    return moveStatus(parsed.payload.orderId, OrderStatus.CONFIRMED, "orderConfirmed.consumer", "Farm confirmed");
  },

  async handleShipmentUpdatedEvent(payload: unknown): Promise<RetailOrder> {
    const schema = z.object({
      payload: z.object({
        orderId: z.string().min(1),
        shipmentId: z.string().optional(),
        status: z.enum(["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELAYED", "DELIVERED", "FAILED"])
      })
    });
    const parsed = schema.parse(payload);

    if (parsed.payload.status === "DELIVERED") {
      const delivered = await moveStatus(
        parsed.payload.orderId,
        OrderStatus.DELIVERED,
        "shipmentUpdated.consumer",
        "Shipping marked order as delivered",
        { shipmentId: parsed.payload.shipmentId }
      );
      await publishOrderDelivered(delivered);
      return delivered;
    }

    return moveStatus(
      parsed.payload.orderId,
      OrderStatus.SHIPPING,
      "shipmentUpdated.consumer",
      `Shipment status: ${parsed.payload.status}`,
      { shipmentId: parsed.payload.shipmentId }
    );
  }
};
