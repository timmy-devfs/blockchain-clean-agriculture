import { RetailOrder, Retailer } from "@prisma/client";
import { z } from "zod";
import { OrderStatus, canTransition } from "../constants/orderStatus";
import { AppError } from "../errors/appError";
import { prisma } from "../config/prisma";
import { chainAxios, farmAxios } from "../config/axios.instances";

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

export const retailOrderService = {
  async searchRetailers(keyword?: string): Promise<Retailer[]> {
    if (!keyword?.trim()) {
      return prisma.retailer.findMany({ orderBy: { createdAt: "desc" } });
    }

    const term = keyword.trim();
    return prisma.retailer.findMany({
      where: {
        OR: [
          { name: { contains: term } },
          { email: { contains: term } },
          { phone: { contains: term } }
        ]
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async createRetailer(payload: unknown): Promise<Retailer> {
    const data = createRetailerSchema.parse(payload);
    return prisma.retailer.create({ data });
  },

  async createOrder(payload: unknown): Promise<RetailOrder> {
    const data = createOrderSchema.parse(payload);

    const retailer = await prisma.retailer.findUnique({ where: { id: data.retailerId } });
    if (!retailer) {
      throw new AppError("RETAILER_NOT_FOUND");
    }

    try {
      await farmAxios.get("/health");
    } catch {
      throw new AppError("DOWNSTREAM_SERVICE_ERROR", "farm service is unavailable");
    }

    const order = await prisma.retailOrder.create({
      data: {
        retailerId: data.retailerId,
        productName: data.productName,
        quantity: data.quantity,
        totalAmount: data.totalAmount,
        qrCode: data.qrCode,
        status: OrderStatus.PENDING_PAYMENT
      }
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        toStatus: OrderStatus.PENDING_PAYMENT
      }
    });

    return order;
  },

  async updateOrderStatus(
    orderId: string,
    toStatus: OrderStatus,
    changedBy?: string,
    note?: string
  ): Promise<RetailOrder> {
    const order = await prisma.retailOrder.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new AppError("ORDER_NOT_FOUND");
    }

    const fromStatus = order.status as OrderStatus;
    if (!canTransition(fromStatus, toStatus)) {
      throw new AppError("INVALID_ORDER_STATUS_FLOW", `${fromStatus} -> ${toStatus}`);
    }

    const updated = await prisma.retailOrder.update({
      where: { id: orderId },
      data: { status: toStatus }
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus,
        toStatus,
        changedBy,
        note
      }
    });

    return updated;
  },

  async scanOrderQr(orderId: string, qrCode: string): Promise<RetailOrder> {
    const order = await prisma.retailOrder.findUnique({ where: { id: orderId } });
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
    const order = await prisma.retailOrder.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new AppError("ORDER_NOT_FOUND");
    }

    if (order.status !== OrderStatus.SHIPPING) {
      throw new AppError("DELIVERY_CONFIRMATION_FAILED", `current status is ${order.status}`);
    }

    return this.updateOrderStatus(orderId, OrderStatus.DELIVERED, changedBy, "Delivery confirmed");
  }
};
