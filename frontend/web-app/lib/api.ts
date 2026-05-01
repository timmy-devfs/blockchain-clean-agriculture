import { axiosInstance } from "@bicap/api-client";
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
function mapShipmentRow(row: Record<string, unknown>): AdminShipmentView {
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

export type AdminSeason = {
  id: string;
  farmId: string;
  cropType: string;
  status: string;
  startDate: string;
  estimatedEndDate: string | null;
  txHash: string | null;
  createdAt: string;
};

function mapAdminSeasonRow(row: Record<string, unknown>): AdminSeason {
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
  axiosInstance
    .put<unknown>(`/api/farm/admin/seasons/${id}/approve`)
    .then((r) => unwrapBody<Record<string, unknown>>(r.data))
    .then((raw) => mapAdminSeasonRow(raw.data as Record<string, unknown>));

// ─── Orders ───────────────────────────────────────────────────────────────

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
  revenueThisMonth: number;
  revenueByMonth: { month: string; revenue: number }[];
  ordersByMonth: { month: string; orders: number }[];
}

export const getDashboardStats = () =>
  axiosInstance
    .get<ApiResponse<DashboardStats>>("/api/reports/admin/dashboard")
    .then((r) => r.data.data);

// ─── IoT ──────────────────────────────────────────────────────────────────

export const getIoTReadings = (farmId: string, type?: string) =>
  axiosInstance
    .get<ApiResponse<PageResponse<IoTReading>>>("/api/iot/readings", {
      params: { farmId, type },
    })
    .then((r) => r.data.data);
