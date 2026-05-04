import { axiosInstance } from "@bicap/api-client";
import { isAxiosError } from "axios";
import type {
  ApiResponse,
  PageResponse,
  User,
  Farm,
  Order,
  Shipment,
  IoTReading,
} from "@bicap/types";

function unwrapBody<T>(body: unknown): T {
  if (
    body != null &&
    typeof body === "object" &&
    "data" in body &&
    ("code" in body || "message" in body)
  ) {
    const d = (body as { data: unknown }).data;
    if (d !== undefined) return d as T;
  }
  return body as T;
}

/** Java `PageResponse`: `content`, `totalElements`, … → shared `PageResponse` */
function normalizeJavaPage<T>(raw: unknown): PageResponse<T> {
  if (raw == null) {
    return { data: [], total: 0, page: 0, size: 20, totalPages: 0 };
  }
  if (Array.isArray(raw)) {
    const arr = raw as T[];
    const n = arr.length;
    return { data: arr, total: n, page: 0, size: n || 20, totalPages: n ? 1 : 0 };
  }
  const o = raw as Record<string, unknown>;
  const data = (
    Array.isArray(o.content)
      ? o.content
      : Array.isArray(o.data)
        ? o.data
        : []
  ) as T[];
  const total =
    typeof o.totalElements === "number"
      ? o.totalElements
      : typeof o.total === "number"
        ? o.total
        : data.length;
  const page = typeof o.page === "number" ? o.page : 0;
  const size = typeof o.size === "number" ? o.size : 20;
  const totalPages =
    typeof o.totalPages === "number"
      ? o.totalPages
      : Math.ceil(total / Math.max(size, 1));
  return { data, total, page, size, totalPages };
}

/** Phân trang phía client khi backend trả cả mảng (retailer/shipping demo). */
function slicePage<T>(rows: T[], page: number, size: number): PageResponse<T> {
  const safeSize = Math.max(size, 1);
  const total = rows.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / safeSize);
  const start = page * safeSize;
  return {
    data: rows.slice(start, start + safeSize),
    total,
    page,
    size,
    totalPages,
  };
}

function toIsoString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}

export interface AdminShipmentView extends Shipment {
  driverName?: string;
  driverPhone?: string;
  driverPlate?: string;
  driverVehicle?: string;
  cargo?: string;
  weight?: string;
  qty?: string;
  farm?: string;
  from?: string;
  to?: string;
  note?: string;
  estimatedTime?: string;
  rawCreatedAt?: string;
}

/** Chuẩn hóa đơn từ retailer-service (Mongo) → `Order` dùng trên admin UI. */
function mapAdminOrderRow(row: Record<string, unknown>): Order {
  const totalPrice =
    typeof row.totalPrice === "number"
      ? row.totalPrice
      : typeof row.totalAmount === "number"
        ? row.totalAmount
        : 0;
  return {
    id: String(row.id ?? row._id ?? ""),
    listingId: String(row.listingId ?? ""),
    retailerId: String(row.retailerId ?? ""),
    farmId: String(row.farmId ?? ""),
    productName: typeof row.productName === "string" ? row.productName : undefined,
    quantity: Number(row.quantity ?? 0),
    totalPrice,
    depositAmount: Number(row.depositAmount ?? 0),
    status: row.status as Order["status"],
    deliveryAddress: String(row.deliveryAddress ?? ""),
    statusHistory: Array.isArray(row.statusHistory)
      ? (row.statusHistory as Order["statusHistory"])
      : [],
    createdAt: toIsoString(row.createdAt),
  };
}

/** Chuẩn hóa shipment từ shipping-service (Java record) → `Shipment` admin UI. */
export function mapShipmentRow(row: Record<string, unknown>): AdminShipmentView {
  const sched = row.scheduledDate ?? row.estimatedDelivery ?? row.date;
  const est =
    sched == null || sched === ""
      ? ""
      : String(sched).includes("T")
        ? String(sched).split("T")[0]!
        : String(sched);
  const createdAt = toIsoString(row.createdAt ?? (est ? `${est}T00:00:00.000Z` : new Date().toISOString()));
  const statusHistory = Array.isArray(row.statusHistory)
    ? (row.statusHistory as Shipment["statusHistory"])
    : [];
  return {
    id: String(row.id ?? ""),
    orderId: String(row.orderId ?? ""),
    driverId: row.driverId != null ? String(row.driverId) : "—",
    driverName: row.driverName != null ? String(row.driverName) : undefined,
    driverPhone: row.driverPhone != null ? String(row.driverPhone) : undefined,
    driverPlate: row.driverPlate != null ? String(row.driverPlate) : undefined,
    driverVehicle: row.driverVehicle != null ? String(row.driverVehicle) : undefined,
    cargo: row.cargo != null ? String(row.cargo) : undefined,
    weight: row.weight != null ? String(row.weight) : undefined,
    qty: row.qty != null ? String(row.qty) : undefined,
    farm: row.farm != null ? String(row.farm) : undefined,
    from: row.from != null ? String(row.from) : undefined,
    to: row.to != null ? String(row.to) : undefined,
    note: row.note != null ? String(row.note) : undefined,
    vehicleId: String(row.vehicleId ?? ""),
    status: String(row.status ?? "CREATED") as Shipment["status"],
    pickupImageUrls: [],
    deliveryImageUrls: [],
    statusHistory,
    estimatedDelivery: est,
    estimatedTime: row.estimatedTime != null ? String(row.estimatedTime) : (row.time != null ? String(row.time) : undefined),
    rawCreatedAt: row.rawCreatedAt != null ? String(row.rawCreatedAt) : undefined,
    createdAt,
  };
}

function mapFarmRow(f: Record<string, unknown>): Farm {
  const created = f.createdAt;
  const createdAt =
    typeof created === "string"
      ? created
      : created instanceof Date
        ? created.toISOString()
        : new Date().toISOString();

  // Derive status: backend có thể trả enum string hoặc boolean
  let status: "PENDING" | "APPROVED" | "REJECTED" = "PENDING";
  if (typeof f.status === "string" && ["PENDING", "APPROVED", "REJECTED"].includes(f.status)) {
    status = f.status as "PENDING" | "APPROVED" | "REJECTED";
  } else if (Boolean(f.isApproved)) {
    status = "APPROVED";
  } else if (f.rejectReason != null) {
    status = "REJECTED";
  }

  const licenseRaw = f.businessLicense;
  const businessLicense =
    licenseRaw != null && typeof licenseRaw === "object"
      ? {
          id: String((licenseRaw as Record<string, unknown>).id ?? ""),
          licenseNumber: String((licenseRaw as Record<string, unknown>).licenseNumber ?? ""),
          issuedBy:
            (licenseRaw as Record<string, unknown>).issuedBy == null
              ? null
              : String((licenseRaw as Record<string, unknown>).issuedBy),
          issuedAt:
            (licenseRaw as Record<string, unknown>).issuedAt == null
              ? null
              : toIsoString((licenseRaw as Record<string, unknown>).issuedAt),
          expiresAt:
            (licenseRaw as Record<string, unknown>).expiresAt == null
              ? null
              : toIsoString((licenseRaw as Record<string, unknown>).expiresAt),
          createdAt: toIsoString((licenseRaw as Record<string, unknown>).createdAt),
          updatedAt: toIsoString((licenseRaw as Record<string, unknown>).updatedAt),
          fileUrl:
            typeof (licenseRaw as Record<string, unknown>).fileUrl === "string"
              ? String((licenseRaw as Record<string, unknown>).fileUrl)
              : undefined,
        }
      : null;

  return {
    id: String(f.id ?? ""),
    ownerId: String(f.ownerId ?? ""),
    farmName: String(f.farmName ?? f.name ?? ""),
    province: String(f.province ?? ""),
    address: String(f.address ?? ""),
    totalArea: Number(f.totalArea ?? f.area ?? 0),
    status,
    isApproved: Boolean(f.isApproved),
    rejectReason: f.rejectReason != null ? String(f.rejectReason) : undefined,
    createdAt,
    businessLicense,
  };
}

// ─── Auth / Accounts ──────────────────────────────────────────────────────

export const getAdminUsers = (params?: {
  role?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  size?: number;
}) =>
  axiosInstance
    .get<unknown>("/api/auth/admin/users", {
      params: {
        ...params,
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      },
    })
    .then((r) => {
      const inner = unwrapBody<unknown>(r.data);
      return normalizeJavaPage<User>(inner);
    });

export const createAdminUser = (body: {
  email: string;
  fullName: string;
  password: string;
}) =>
  axiosInstance
    .post<ApiResponse<User>>("/api/auth/admin/users", body)
    .then((r) => r.data.data);

export const updateUser = (id: string, body: Partial<{ role: string; isActive: boolean }>) =>
  axiosInstance
    .put<ApiResponse<User>>(`/api/auth/admin/users/${id}`, body)
    .then((r) => r.data.data);

// ─── Farm ─────────────────────────────────────────────────────────────────

export type FarmStatus = "PENDING" | "APPROVED" | "REJECTED";

export const getAdminFarms = (status: FarmStatus, params?: { page?: number; size?: number }) =>
  axiosInstance.get<unknown>("/api/farm/admin/farms", {
    params: { status, page: params?.page ?? 0, size: params?.size ?? 50 },
  }).then((r) => {
    const inner = unwrapBody<unknown>(r.data);
    const page = normalizeJavaPage<Record<string, unknown>>(inner);
    return {
      ...page,
      data: page.data.map((row) => mapFarmRow(row)),
    } as PageResponse<Farm>;
  });

export const getFarmDetail = (id: string) =>
  axiosInstance
    .get<unknown>(`/api/farm/admin/farms/${id}`)
    .then((r) => {
      const raw = unwrapBody<Record<string, unknown>>(r.data);
      return mapFarmRow(raw);
    });

export const approveFarm = (id: string) =>
  axiosInstance
    .put<unknown>(`/api/farm/admin/farms/${id}/approve`)
    .then((r) => {
      const raw = unwrapBody<Record<string, unknown>>(r.data);
      return mapFarmRow(raw);
    });

export const rejectFarm = (id: string, rejectReason: string) =>
  axiosInstance
    .put<unknown>(`/api/farm/admin/farms/${id}/reject`, { rejectReason })
    .then((r) => {
      const raw = unwrapBody<Record<string, unknown>>(r.data);
      return mapFarmRow(raw);
    });

export function getAxiosErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const d = error.response?.data;
    if (typeof d === "string" && d.trim()) return d;
    if (d != null && typeof d === "object") {
      const o = d as Record<string, unknown>;
      if (typeof o.message === "string" && o.message.trim()) return o.message;
      const errs = o.errors;
      if (errs != null && typeof errs === "object") {
        const flat = (errs as { fieldErrors?: Record<string, string[]> }).fieldErrors;
        if (flat && typeof flat === "object") {
          const parts = Object.entries(flat)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
            .filter(Boolean);
          if (parts.length) return parts.join(" · ");
        }
      }
    }
    const st = error.response?.status;
    if (st === 503) return "Dịch vụ farm tạm không phản hồi (503). Kiểm tra Docker: bicap-farm, bicap-gateway.";
    if (st === 502) return "Gateway không kết nối được farm-service (502).";
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** GET /api/farm/farms — trang trại do FARM_MANAGER sở hữu (gateway). */
export const getOwnerFarms = () =>
  axiosInstance.get<unknown>("/api/farm/farms").then((r) => {
    const inner = unwrapBody<unknown>(r.data);
    const arr = Array.isArray(inner) ? inner : [];
    return arr.map((row) => mapFarmRow(row as Record<string, unknown>));
  });

export type CreateFarmPayload = {
  name: string;
  address: string;
  province: string;
  area: number;
};

export const createOwnerFarm = (body: CreateFarmPayload) =>
  axiosInstance.post<unknown>("/api/farm/farms", body).then((r) => {
    const raw = unwrapBody<Record<string, unknown>>(r.data);
    if (raw == null || typeof raw !== "object" || !String(raw.id ?? "").trim()) {
      throw new Error("Phản hồi tạo farm không hợp lệ (thiếu id). Kiểm tra gateway và farm-service.");
    }
    return mapFarmRow(raw);
  });

export type FarmerSeasonRow = {
  id: string;
  farmId: string;
  cropType: string;
  status: string;
  startDate: string;
  estimatedEndDate: string | null;
  totalYield: number | null;
  txHash: string | null;
  createdAt: string;
};

function mapFarmerSeasonRow(row: Record<string, unknown>): FarmerSeasonRow {
  const ty = row.totalYield;
  return {
    id: String(row.id ?? ""),
    farmId: String(row.farmId ?? ""),
    cropType: String(row.cropType ?? ""),
    status: String(row.status ?? ""),
    startDate: toIsoString(row.startDate),
    estimatedEndDate:
      row.estimatedEndDate == null ? null : toIsoString(row.estimatedEndDate),
    totalYield:
      ty == null || ty === ""
        ? null
        : typeof ty === "number"
          ? ty
          : Number(ty),
    txHash: row.txHash == null ? null : String(row.txHash),
    createdAt: toIsoString(row.createdAt),
  };
}

export const getOwnerSeasons = (params?: { page?: number; limit?: number }) => {
  const page = params?.page ?? 1;
  const rawLimit = params?.limit ?? 100;
  const limit = Math.min(Math.max(rawLimit, 1), 500);

  return axiosInstance
    .get<unknown>("/api/farm/seasons", { params: { page, limit } })
    .then((r) => {
      const inner = unwrapBody<unknown>(r.data);
      if (inner != null && typeof inner === "object") {
        const o = inner as Record<string, unknown>;
        const items = Array.isArray(o.items) ? o.items : [];
        return {
          items: (items as Record<string, unknown>[]).map(mapFarmerSeasonRow),
          total: typeof o.total === "number" ? o.total : items.length,
        };
      }
      return { items: [] as FarmerSeasonRow[], total: 0 };
    });
};

export type CreateSeasonPayload = {
  farmId: string;
  cropType: string;
  startDate: string;
  estimatedEndDate?: string;
};

export const createOwnerSeason = async (
  body: CreateSeasonPayload,
  opts?: { estimatedYield?: number }
): Promise<FarmerSeasonRow> => {
  const created = await axiosInstance
    .post<unknown>("/api/farm/seasons", {
      farmId: body.farmId,
      cropType: body.cropType,
      startDate: body.startDate,
      estimatedEndDate: body.estimatedEndDate,
    })
    .then((r) =>
      mapFarmerSeasonRow(unwrapBody<Record<string, unknown>>(r.data))
    );

  if (
    opts?.estimatedYield != null &&
    Number.isFinite(opts.estimatedYield) &&
    opts.estimatedYield > 0
  ) {
    return axiosInstance
      .put<unknown>(`/api/farm/seasons/${created.id}`, {
        totalYield: opts.estimatedYield,
      })
      .then((r) =>
        mapFarmerSeasonRow(unwrapBody<Record<string, unknown>>(r.data))
      );
  }

  return created;
};

export type MarketplaceListingRow = {
  id: string;
  farmId: string;
  seasonId: string;
  title: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
};

export const getOwnerMarketplaceListings = () =>
  axiosInstance.get<unknown>("/api/farm/marketplace/listings").then((r) => {
    const inner = unwrapBody<unknown>(r.data);
    let arr: unknown[] = [];
    if (Array.isArray(inner)) arr = inner;
    else if (inner != null && typeof inner === "object" && "items" in inner) {
      const it = (inner as { items?: unknown }).items;
      if (Array.isArray(it)) arr = it;
    }
    return arr.map((row): MarketplaceListingRow => {
      const x = row as Record<string, unknown>;
      return {
        id: String(x.id ?? ""),
        farmId: String(x.farmId ?? ""),
        seasonId: String(x.seasonId ?? ""),
        title: String(x.title ?? ""),
        description: x.description == null ? null : String(x.description),
        quantity: Number(x.quantity ?? 0),
        unitPrice: Number(x.unitPrice ?? 0),
      };
    });
  });

export const createMarketplaceListing = (body: {
  farmId: string;
  seasonId: string;
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
}) =>
  axiosInstance
    .post<unknown>("/api/farm/marketplace/listings", body)
    .then((r) => {
      const raw = unwrapBody<Record<string, unknown>>(r.data);
      const x = raw as Record<string, unknown>;
      return {
        id: String(x.id ?? ""),
        farmId: String(x.farmId ?? ""),
        seasonId: String(x.seasonId ?? ""),
        title: String(x.title ?? ""),
        description: x.description == null ? null : String(x.description),
        quantity: Number(x.quantity ?? 0),
        unitPrice: Number(x.unitPrice ?? 0),
      } satisfies MarketplaceListingRow;
    });

export const postSeasonUpdate = (
  seasonId: string,
  body: { status: string; note?: string }
) => axiosInstance.post<unknown>(`/api/farm/seasons/${seasonId}/updates`, body);

export type AdminSeason = {
  id: string;
  farmId: string;
  cropType: string;
  status: string;
  startDate: string;
  estimatedEndDate: string | null;
  txHash: string | null;
  createdAt: string;
  farmName?: string;
  province?: string;
  totalYield: number | null;
};

function mapAdminSeasonRow(row: Record<string, unknown>): AdminSeason {
  const ty = row.totalYield;
  return {
    id: String(row.id ?? ""),
    farmId: String(row.farmId ?? ""),
    cropType: String(row.cropType ?? ""),
    status: String(row.status ?? "PREPARING"),
    startDate: toIsoString(row.startDate),
    estimatedEndDate:
      row.estimatedEndDate == null
        ? null
        : toIsoString(row.estimatedEndDate),
    txHash: row.txHash == null ? null : String(row.txHash),
    createdAt: toIsoString(row.createdAt),
    farmName: typeof row.farmName === "string" ? row.farmName : undefined,
    province: typeof row.province === "string" ? row.province : undefined,
    totalYield:
      ty == null || ty === ""
        ? null
        : typeof ty === "number"
          ? ty
          : Number(ty),
  };
}

export const getAdminSeasons = (onChain: "all" | "pending" | "confirmed" = "pending") =>
  axiosInstance
    .get<unknown>("/api/farm/admin/seasons", { params: { onChain } })
    .then((r) => {
      const inner = unwrapBody<unknown>(r.data);
      const arr = Array.isArray(inner) ? (inner as Record<string, unknown>[]) : [];
      return arr.map(mapAdminSeasonRow);
    });

export const approveSeasonForBlockchain = (id: string) =>
  axiosInstance.put<unknown>(`/api/farm/admin/seasons/${id}/approve`).then((r) => {
    const raw = unwrapBody<Record<string, unknown>>(r.data);
    const row =
      raw != null &&
      typeof raw === "object" &&
      "id" in raw &&
      String((raw as Record<string, unknown>).id).length > 0
        ? (raw as Record<string, unknown>)
        : (raw as { data?: Record<string, unknown> })?.data;
    if (!row || typeof row !== "object") {
      throw new Error("Phản hồi duyệt mùa vụ không hợp lệ");
    }
    return mapAdminSeasonRow(row);
  });

// ─── Orders (retailer-service qua gateway: /api/retail/… hoặc alias /api/order/…) ──

/** Body POST /api/retail/orders — khớp `createOrderSchema` retailer-service. */
export type CreateRetailOrderBody = {
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
  gateway?: "VNPAY" | "MOMO";
};

export type MarketplaceListingProduct = {
  id: string;
  farmId: string;
  seasonId: string;
  title: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  farm: { id: string; name: string; ownerId: string };
  season: { id: string; cropType: string; status: string };
};

function mapMarketplaceProduct(row: Record<string, unknown>): MarketplaceListingProduct {
  const farm = row.farm as Record<string, unknown> | undefined;
  const season = row.season as Record<string, unknown> | undefined;
  return {
    id: String(row.id ?? ""),
    farmId: String(row.farmId ?? ""),
    seasonId: String(row.seasonId ?? ""),
    title: String(row.title ?? ""),
    description: row.description == null ? null : String(row.description),
    quantity: Number(row.quantity ?? 0),
    unitPrice: Number(row.unitPrice ?? 0),
    farm: {
      id: farm != null ? String(farm.id ?? "") : "",
      name: farm != null ? String(farm.name ?? "") : "",
      ownerId: farm != null ? String(farm.ownerId ?? "") : "",
    },
    season: {
      id: season != null ? String(season.id ?? "") : "",
      cropType: season != null ? String(season.cropType ?? "") : "",
      status: season != null ? String(season.status ?? "") : "",
    },
  };
}

/**
 * GET /api/farm/marketplace/products — catalog công khai (không hardcode).
 * `cropType` được truyền như `keyword` (API farm không lọc province riêng).
 */
export const getListings = (params?: {
  province?: string;
  cropType?: string;
  page?: number;
  size?: number;
}) =>
  axiosInstance
    .get<unknown>("/api/farm/marketplace/products", {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 48,
        keyword: params?.cropType,
      },
    })
    .then((r) => {
      const inner = unwrapBody<{ items?: unknown[] }>(r.data);
      const items = Array.isArray(inner?.items) ? inner.items : [];
      return (items as Record<string, unknown>[]).map(mapMarketplaceProduct);
    });

export const createRetailerOrder = (body: CreateRetailOrderBody) =>
  axiosInstance.post<unknown>("/api/retail/orders", body).then((r) => {
    const raw = unwrapBody<{ order?: Record<string, unknown>; paymentUrl?: string }>(r.data);
    if (raw && typeof raw === "object" && raw.order != null) {
      return {
        order: raw.order as Record<string, unknown>,
        paymentUrl: String(raw.paymentUrl ?? ""),
      };
    }
    throw new Error("Phản hồi tạo đơn không hợp lệ");
  });

/** GET /api/retail/orders — đơn của retailer đăng nhập (gateway gửi X-User-Id). */
export const getMyOrders = () =>
  axiosInstance.get<unknown>("/api/retail/orders").then((r) => {
    const inner = unwrapBody<unknown>(r.data);
    return Array.isArray(inner) ? inner : [];
  });

/**
 * Admin: GET /api/order/admin/orders → gateway rewrite → /api/retail/admin/orders
 */
export const getAdminOrders = (params?: {
  status?: string;
  page?: number;
  size?: number;
}) =>
  axiosInstance
    .get<unknown>("/api/order/admin/orders", {
      params: { status: params?.status },
    })
    .then((r) => {
      const inner = unwrapBody<unknown>(r.data);
      const arr = Array.isArray(inner) ? (inner as Record<string, unknown>[]) : [];
      const mapped = arr.map(mapAdminOrderRow);
      return slicePage(mapped, params?.page ?? 0, params?.size ?? 20);
    });

/** Best-effort thanh toán (khi không dùng SKIP_ORDER_PAYMENT): callback nội bộ retailer. */
export const tryRetailPaymentCallback = (orderId: string) =>
  axiosInstance
    .post<unknown>("/api/retail/orders/payment-callback", { orderId })
    .then((r) => unwrapBody<unknown>(r.data));

// ─── Shipping (Java shipping-service) ─────────────────────────────────────

/** Khớp PendingConfirmedOrderResponse — orderId số hash để gán shipment. */
export type PendingConfirmedOrderRow = {
  id: string;
  orderId: number;
  deliveryAddress: string | null;
  shipmentId: number | null;
  farmId: number | null;
  retailerId: number | null;
};

export const getConfirmedOrdersForShipping = () =>
  axiosInstance.get<unknown>("/api/shipping/orders/confirmed").then((r) => {
    const inner = unwrapBody<unknown>(r.data);
    return Array.isArray(inner) ? (inner as PendingConfirmedOrderRow[]) : [];
  });

export type ShippingDriverRow = {
  id: number;
  fullName: string;
  phone: string | null;
  licenseNo: string | null;
  /** UUID identity-service (JWT sub) — FCM / app Driver */
  identityUserId?: string | null;
  identity_user_id?: string | null;
};

export type ShippingVehicleRow = {
  id: number;
  licensePlate: string;
  type: string;
  capacity?: number | null;
};

export const getShippingDrivers = () =>
  axiosInstance.get<unknown>("/api/shipping/drivers").then((r) => {
    const inner = unwrapBody<unknown>(r.data);
    const arr = Array.isArray(inner) ? inner : [];
    return (arr as Record<string, unknown>[]).map((row): ShippingDriverRow => {
      const idNum = row.id;
      return {
        id: typeof idNum === "number" ? idNum : Number(idNum ?? 0),
        fullName: String(row.fullName ?? ""),
        phone: row.phone == null ? null : String(row.phone),
        licenseNo: row.licenseNo == null ? null : String(row.licenseNo),
        identityUserId:
          row.identityUserId != null
            ? String(row.identityUserId)
            : row.identity_user_id != null
              ? String(row.identity_user_id)
              : null,
      };
    });
  });

export const getShippingVehicles = () =>
  axiosInstance.get<unknown>("/api/shipping/vehicles").then((r) => {
    const inner = unwrapBody<unknown>(r.data);
    const arr = Array.isArray(inner) ? inner : [];
    return arr as ShippingVehicleRow[];
  });

export type CreateShipmentBody = {
  orderId: number;
  driverId: number;
  vehicleId: number;
  farmId?: number | null;
  retailerId?: number | null;
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  scheduledDate?: string | null;
};

export const createShipment = (body: CreateShipmentBody) =>
  axiosInstance.post<unknown>("/api/shipping/shipments", body).then((r) => unwrapBody<unknown>(r.data));

// ─── Shipments ────────────────────────────────────────────────────────────

export const getAdminShipments = async (params?: {
  status?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<AdminShipmentView>> => {
  const page = params?.page ?? 0;
  const size = params?.size ?? 20;

  const loadFromShippingService = async (): Promise<AdminShipmentView[]> => {
    const r = await axiosInstance.get<unknown>("/api/shipping/shipments");
    const inner = unwrapBody<unknown>(r.data);
    const arr = Array.isArray(inner) ? (inner as Record<string, unknown>[]) : [];
    const filtered = params?.status
      ? arr.filter((x) => String(x.status) === params.status)
      : arr;
    return filtered.map(mapShipmentRow);
  };

  const loadFromSyncedFile = async (): Promise<AdminShipmentView[]> => {
    try {
      const res = await fetch("/internal/shipping-sync", { cache: "no-store" });
      if (!res.ok) return [];
      const body = (await res.json()) as { data?: Record<string, unknown>[] };
      const arr = Array.isArray(body?.data) ? body.data : [];
      const filtered = params?.status
        ? arr.filter((x) => String(x.status) === params.status)
        : arr;
      return filtered.map(mapShipmentRow);
    } catch {
      return [];
    }
  };

  try {
    const mapped = await loadFromShippingService();
    if (mapped.length > 0) {
      return slicePage<AdminShipmentView>(mapped, page, size);
    }
  } catch {
    /* fallback sync */
  }

  const synced = await loadFromSyncedFile();
  return slicePage<AdminShipmentView>(synced, page, size);
};

// ─── Blockchain / Contracts ───────────────────────────────────────────────

export interface ContractStatus {
  farmTraceAddress: string;
  productCertAddress: string;
  lastDeployedAt: string;
}

export const getContractsStatus = () =>
  axiosInstance
    .get<ApiResponse<ContractStatus>>("/api/chain/contracts/status")
    .then((r) => r.data?.data ?? {
      farmTraceAddress: "",
      productCertAddress: "",
      lastDeployedAt: "",
    });

export interface DeployResult {
  txHash: string;
  farmTraceAddress: string;
  productCertAddress: string;
}

export const deployContracts = () =>
  axiosInstance
    .post<ApiResponse<DeployResult>>("/api/chain/contracts/deploy")
    .then((r) => r.data.data);

// ─── Reports ──────────────────────────────────────────────────────────────

export interface Report {
  id: string;
  reporterId: string;
  reporterRole: string;
  type: string;
  content: string;
  imageUrls: string[];
  status: "PENDING" | "RESOLVED";
  adminNote?: string;
  resolvedAt?: string;
  createdAt: string;
}

export const getAdminReports = (params?: {
  type?: string;
  status?: string;
  role?: string;
}) =>
  axiosInstance
    .get<unknown>("/api/reports/admin", { params })
    .then((r) => {
      const inner = unwrapBody<unknown>(r.data);
      return normalizeJavaPage<Report>(inner);
    });

export const resolveReport = (id: string, adminNote: string) =>
  axiosInstance
    .put<ApiResponse<Report>>(`/api/reports/${id}/resolve`, { adminNote })
    .then((r) => r.data.data);

// ─── Dashboard Stats ──────────────────────────────────────────────────────

export interface DashboardStats {
  approvedFarms: number;
  totalRetailers: number;
  ordersToday: number;
  /** Giao dịch / mốc blockchain (dashboard báo cáo) */
  blockchainTxns?: number;
  revenueThisMonth: number;
  revenueByMonth: { month: string; revenue: number }[];
  ordersByMonth: { month: string; orders: number }[];
}

const EMPTY_DASHBOARD: DashboardStats = {
  approvedFarms: 0,
  totalRetailers: 0,
  ordersToday: 0,
  blockchainTxns: 0,
  revenueThisMonth: 0,
  revenueByMonth: [],
  ordersByMonth: [],
};

export const getDashboardStats = () =>
  axiosInstance
    .get<ApiResponse<DashboardStats>>("/api/reports/admin/dashboard")
    .then((r) => {
      const d = r.data.data;
      return {
        ...EMPTY_DASHBOARD,
        ...d,
        approvedFarms: Number(d?.approvedFarms ?? 0),
        totalRetailers: Number(d?.totalRetailers ?? 0),
        ordersToday: Number(d?.ordersToday ?? 0),
        blockchainTxns: Number(d?.blockchainTxns ?? 0),
        revenueThisMonth: Number(d?.revenueThisMonth ?? 0),
        revenueByMonth: Array.isArray(d?.revenueByMonth) ? d!.revenueByMonth : [],
        ordersByMonth: Array.isArray(d?.ordersByMonth) ? d!.ordersByMonth : [],
      };
    })
    .catch(() => EMPTY_DASHBOARD);

// ─── IoT ──────────────────────────────────────────────────────────────────

export const getIoTReadings = (farmId: string, type?: string) =>
  axiosInstance
    .get<ApiResponse<PageResponse<IoTReading>>>("/api/iot/readings", {
      params: { farmId, type },
    })
    .then((r) => r.data.data);
