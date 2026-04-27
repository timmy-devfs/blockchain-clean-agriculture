import { NextResponse } from "next/server";

type ShippingOrder = {
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

const SHIPPING_SYNC_SOURCE =
  process.env.SHIPPING_SYNC_SOURCE_URL ??
  "http://web-shipping:3003/api/sync-orders";

function mapStatus(status?: string) {
  switch (status) {
    case "Đã lấy hàng":
      return "PICKED_UP";
    case "Đang vận chuyển":
      return "IN_TRANSIT";
    case "Đã giao":
      return "DELIVERED";
    case "Hủy":
      return "RETURNED";
    case "Chờ xử lý":
    default:
      return "ASSIGNED";
  }
}

function toIsoDate(input?: string) {
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

function mapTimelineStatus(label?: string) {
  const v = (label ?? "").toLowerCase();
  if (v.includes("đã giao")) return "DELIVERED";
  if (v.includes("vận chuyển")) return "IN_TRANSIT";
  if (v.includes("nhận hàng") || v.includes("đã lấy")) return "PICKED_UP";
  if (v.includes("tạo lô")) return "ASSIGNED";
  return "ASSIGNED";
}

export async function GET() {
  try {
    const res = await fetch(SHIPPING_SYNC_SOURCE, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { data: [], source: SHIPPING_SYNC_SOURCE, error: `upstream_${res.status}` },
        { status: 200 }
      );
    }

    const raw = (await res.json()) as ShippingOrder[];
    const rows = Array.isArray(raw) ? raw : [];

    const mapped = rows.map((o, idx) => {
      const timeline = Array.isArray(o.timeline) ? o.timeline : [];
      const statusHistory = timeline.map((item, tIdx) => ({
        id: `sync-h-${o.id ?? idx}-${tIdx}`,
        shipmentId: `sync-${o.id ?? idx}`,
        status: mapTimelineStatus(item.label),
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
      status: mapStatus(o.status),
      pickupImageUrls: [],
      deliveryImageUrls: [],
      statusHistory,
      estimatedDelivery: o.date ?? "",
      estimatedTime: o.time ?? "",
      createdAt: toIsoDate(o.createdAt ?? o.date),
      rawCreatedAt: o.createdAt ?? "",
    };
    });

    return NextResponse.json({ data: mapped, source: SHIPPING_SYNC_SOURCE });
  } catch (error) {
    return NextResponse.json(
      {
        data: [],
        source: SHIPPING_SYNC_SOURCE,
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 200 }
    );
  }
}

