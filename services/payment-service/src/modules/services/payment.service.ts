import { PaymentGateway, PaymentStatus } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { AppError } from "../../errors/appError";
import { publishPaymentSuccess } from "./paymentSuccess.producer";
import { buildMomoPaymentUrl, verifyMomoCallback } from "../utils/momoUtil";
import { buildVNPayPaymentUrl, verifyVNPayCallback } from "../utils/vnpayUtil";
import { CallbackInput, CreatePaymentInput, HistoryQueryInput } from "../schemas/payment.schema";

const toCallbackPayloadMap = (payload: CallbackInput): Record<string, string> => ({
  paymentId: payload.paymentId,
  orderId: payload.orderId,
  amount: String(payload.amount),
  type: payload.type,
  gateway: payload.gateway,
  transactionId: payload.transactionId,
  paidAt: payload.paidAt ?? ""
});

export const paymentService = {
  async createPayment(userId: string, input: CreatePaymentInput): Promise<unknown> {
    const payment = await prisma.payment.create({
      data: {
        payerId: input.payerId ?? userId,
        orderId: input.orderId,
        amount: input.amount,
        type: input.type,
        gateway: input.gateway,
        status: PaymentStatus.PENDING
      }
    });

    const paymentUrl =
      input.gateway === PaymentGateway.VNPAY
        ? buildVNPayPaymentUrl({
            paymentId: payment.id,
            orderId: input.orderId,
            amount: input.amount,
            returnUrl: input.returnUrl
          })
        : buildMomoPaymentUrl({
            paymentId: payment.id,
            orderId: input.orderId,
            amount: input.amount,
            returnUrl: input.returnUrl
          });

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { paymentUrl }
    });

    return {
      paymentId: updated.id,
      orderId: updated.orderId,
      amount: updated.amount,
      type: updated.type,
      gateway: updated.gateway,
      status: updated.status,
      paymentUrl: updated.paymentUrl
    };
  },

  async handleCallback(input: CallbackInput): Promise<unknown> {
    const verified =
      input.gateway === PaymentGateway.VNPAY
        ? verifyVNPayCallback(toCallbackPayloadMap(input), input.signature)
        : verifyMomoCallback(toCallbackPayloadMap(input), input.signature);

    if (!verified) {
      throw new AppError("INVALID_SIGNATURE");
    }

    const payment = await prisma.payment.findUnique({
      where: { id: input.paymentId }
    });

    if (!payment || payment.orderId !== input.orderId) {
      throw new AppError("PAYMENT_NOT_FOUND");
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      return {
        paymentId: payment.id,
        status: payment.status
      };
    }

    const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCESS,
        transactionId: input.transactionId,
        paidAt
      }
    });

    await publishPaymentSuccess({
      paymentId: updated.id,
      orderId: updated.orderId,
      amount: updated.amount,
      type: updated.type,
      paidAt
    });

    return {
      paymentId: updated.id,
      orderId: updated.orderId,
      status: updated.status,
      transactionId: updated.transactionId
    };
  },

  async getHistory(userId: string, query: HistoryQueryInput): Promise<unknown> {
    const skip = (query.page - 1) * query.limit;
    const [total, items] = await Promise.all([
      prisma.payment.count({
        where: { payerId: userId }
      }),
      prisma.payment.findMany({
        where: { payerId: userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit
      })
    ]);

    return {
      page: query.page,
      limit: query.limit,
      total,
      items
    };
  },

  async refundByAdmin(paymentId: string, reason?: string): Promise<unknown> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      throw new AppError("PAYMENT_NOT_FOUND");
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new AppError("INVALID_PAYMENT_STATUS", `current status is ${payment.status}`);
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REFUNDED,
        refundedAt: new Date()
      }
    });

    return {
      paymentId: updated.id,
      orderId: updated.orderId,
      status: updated.status,
      refundedAt: updated.refundedAt,
      reason: reason ?? null
    };
  }
};
