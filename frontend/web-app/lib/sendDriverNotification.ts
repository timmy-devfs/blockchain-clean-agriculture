import { tokenStorage } from "@bicap/api-client";

function gatewayOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api").replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw.slice(0, -4) : raw;
}

/**
 * POST /api/notify/notifications/send — FCM tới driver (userId = JWT sub).
 * Data payload: chỉ string (khớp notification-service SendPushRequest).
 */
export async function sendDriverNotification(params: {
  driverIdentityUserId: string;
  shipmentId: string;
  shipmentStatus?: string;
}) {
  const { driverIdentityUserId, shipmentId, shipmentStatus = "ASSIGNED" } = params;

  if (!driverIdentityUserId) {
    console.warn("[FCM] Không có identityUserId cho driver — bỏ qua push notification");
    return;
  }

  const isNew = shipmentStatus === "ASSIGNED";
  const token = tokenStorage.getAccessToken();
  if (!token?.trim()) {
    console.warn("[FCM] Không có access token — bỏ qua push notification");
    return;
  }

  try {
    const res = await fetch(`${gatewayOrigin()}/api/notify/notifications/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: driverIdentityUserId,
        title: isNew ? "🚚 Đơn hàng mới" : "📋 Cập nhật chuyến hàng",
        body: isNew
          ? "Bạn có 1 đơn hàng mới cần giao. Bấm để xem chi tiết."
          : `Trạng thái chuyến hàng đã cập nhật: ${shipmentStatus}`,
        data: {
          shipmentId: String(shipmentId),
          type: isNew ? "NEW_SHIPMENT" : "SHIPMENT_UPDATE",
          status: String(shipmentStatus),
          screen: "shipment_detail",
        },
      }),
    });

    if (res.ok) {
      console.log("[FCM] Push sent to driver:", driverIdentityUserId);
    } else {
      const text = await res.text();
      try {
        console.warn("[FCM] Push failed:", JSON.parse(text));
      } catch {
        console.warn("[FCM] Push failed:", text);
      }
    }
  } catch (err) {
    console.error("[FCM] Push error (không crash app):", err);
  }
}
