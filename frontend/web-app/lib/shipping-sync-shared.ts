import path from "path";

/**
 * File JSON dùng chung: POST /api/sync-orders ghi, GET /internal/shipping-sync đọc.
 * Mặc định: `tmp/sync-orders.json` dưới cwd (Next.js app root).
 */
export function getSharedOrdersFilePath(): string {
  if (process.env.SHARED_ORDERS_PATH) return process.env.SHARED_ORDERS_PATH;
  return path.join(process.cwd(), "tmp", "sync-orders.json");
}

export type DashboardSyncedOrder = {
  id?: string;
  cargo?: string;
  weight?: string;
  qty?: string;
  farm?: string;
  from?: string;
  to?: string;
  driver?: string;
  driverPhone?: string;
  driverPlate?: string;
  driverVehicle?: string;
  status?: string;
  note?: string;
  date?: string;
  time?: string;
  createdAt?: string;
  timeline?: Array<{
    time?: string;
    label?: string;
    desc?: string;
  }>;
};

export function mapStatusFromDashboard(status?: string): string {
  switch (status) {
    case "Đã lấy hàng":
      return "PICKED_UP";
    case "Đang vận chuyển":
      return "IN_TRANSIT";
    case "Đã giao":
      return "DELIVERED";
    case "Hủy":
      return "RETURNED";
    case "Chậm trễ":
      return "DELAYED";
    case "Chờ xử lý":
    default:
      return "ASSIGNED";
  }
}

export function toIsoDateFromDashboard(input?: string): string {
  if (!input) return new Date().toISOString();
  if (input.includes("T")) return input;
  const vnDate = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (vnDate) {
    const [, dd, mm, yyyy] = vnDate;
    const day = dd?.padStart(2, "0");
    const month = mm?.padStart(2, "0");
    return `${yyyy}-${month}-${day}T00:00:00.000Z`;
  }
  return `${input}T00:00:00.000Z`;
}

function mapTimelineStatusLabel(label?: string): string {
  const v = (label ?? "").toLowerCase();
  if (v.includes("đã giao")) return "DELIVERED";
  if (v.includes("vận chuyển")) return "IN_TRANSIT";
  if (v.includes("nhận hàng") || v.includes("đã lấy")) return "PICKED_UP";
  if (v.includes("tạo lô")) return "ASSIGNED";
  return "ASSIGNED";
}

/** Chuẩn hóa mảng đơn từ shipping dashboard → payload `data` cho admin (trước mapShipmentRow). */
export function mapDashboardOrdersToSyncPayload(
  rows: DashboardSyncedOrder[],
): Record<string, unknown>[] {
  return rows.map((o, idx) => {
    const timeline = Array.isArray(o.timeline) ? o.timeline : [];
    const statusHistory = timeline.map((item, tIdx) => ({
      id: `sync-h-${o.id ?? idx}-${tIdx}`,
      shipmentId: `sync-${o.id ?? idx}`,
      status: mapTimelineStatusLabel(item.label),
      note: item.label ?? "",
      location: item.desc ?? "",
      createdAt: item.time ?? "",
    }));

    return {
      id: `sync-${o.id ?? idx}`,
      orderId: String(o.id ?? ""),
      driverId: o.driver?.trim() ? o.driver : "—",
      driverName: o.driver?.trim() ? o.driver : "—",
      driverPhone: o.driverPhone ?? "",
      driverPlate: o.driverPlate ?? "",
      driverVehicle: o.driverVehicle ?? "",
      cargo: o.cargo ?? "",
      weight: o.weight ?? "",
      qty: o.qty ?? "",
      farm: o.farm ?? "",
      from: o.from ?? "",
      to: o.to ?? "",
      note: o.note ?? "",
      vehicleId: "",
      status: mapStatusFromDashboard(o.status),
      pickupImageUrls: [],
      deliveryImageUrls: [],
      statusHistory,
      estimatedDelivery: o.date ?? "",
      estimatedTime: o.time ?? "",
      createdAt: toIsoDateFromDashboard(o.createdAt ?? o.date),
      rawCreatedAt: o.createdAt ?? "",
    };
  });
}
