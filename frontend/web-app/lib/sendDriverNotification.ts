import { axiosInstance } from "@bicap/api-client";

export type SendDriverNotificationArgs = {
  driverIdentityUserId: string;
  shipmentId: string;
  shipmentStatus: string;
};

/**
 * FCM tới tài xế (notification-service) — cùng contract với legacy ShippingApi.sendDriverPush.
 * Gateway: POST /api/notify/notifications/send
 */
export async function sendDriverNotification(
  args: SendDriverNotificationArgs
): Promise<void> {
  await axiosInstance.post("/api/notify/notifications/send", {
    userId: args.driverIdentityUserId,
    title: "Chuyến hàng mới",
    body: `Bạn được gán chuyến hàng #${args.shipmentId}.`,
    data: {
      shipmentId: args.shipmentId,
      status: args.shipmentStatus,
      type: "SHIPMENT_ASSIGNED",
    },
  });
}
