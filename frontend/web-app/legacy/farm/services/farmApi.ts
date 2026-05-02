import dayjs from "dayjs";
import { jsPDF } from "jspdf";
import {
  AlertItem,
  FarmProfile,
  IotDashboard,
  MarketplaceItem,
  Order,
  OrderStatus,
  PackageInfo,
  Season,
  SeasonUpdate
} from "../types";
import { gateway } from "./gateway";

const isLikelyObjectId = (value: string): boolean => /^[a-fA-F0-9]{24}$/.test(value);

/** Chỉ bật khi dev offline: NEXT_PUBLIC_USE_FARM_MOCK=true. */
const useFarmMockFallback = (): boolean => process.env.NEXT_PUBLIC_USE_FARM_MOCK === "true";

let cachedFarmId: string | null = null;

function gatewayErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const ax = error as { response?: { status?: number; data?: unknown } };
    const res = ax.response?.data;
    if (typeof res === "string" && res.trim()) return res;
    if (res != null && typeof res === "object") {
      const o = res as Record<string, unknown>;
      if (typeof o.message === "string" && o.message.trim()) return o.message;
      const inner = o.data;
      if (inner != null && typeof inner === "object" && typeof (inner as Record<string, unknown>).message === "string") {
        return String((inner as Record<string, unknown>).message);
      }
    }
    const st = ax.response?.status;
    if (st === 503) return "Farm-service tạm không phản hồi (gateway 503). Kiểm tra container farm-service / Mongo / Redis.";
    if (st === 502) return "Gateway không kết nối được farm-service (502).";
    if (st === 403) return "Không đủ quyền hoặc farm chưa được admin phê duyệt.";
    if (st === 401) return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
    if (st === 404) return "Không tìm thấy tài nguyên trên server.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Lỗi kết nối API";
}

function unwrapApiData<T>(payload: unknown): T {
  if (
    payload != null &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>)
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function extractSeasonRows(payload: unknown): Record<string, unknown>[] {
  const unwrapped = unwrapApiData<unknown>(payload);
  if (Array.isArray(unwrapped)) return unwrapped as Record<string, unknown>[];
  if (unwrapped != null && typeof unwrapped === "object") {
    const obj = unwrapped as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[];
    if (Array.isArray(obj.content)) return obj.content as Record<string, unknown>[];
    if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
  }
  return [];
}

function mapApiSeason(row: Record<string, unknown>): Season {
  const start = row.startDate;
  const end = row.estimatedEndDate;
  const toIso = (v: unknown) =>
    typeof v === "string" ? v : v instanceof Date ? v.toISOString() : new Date(String(v)).toISOString();
  return {
    id: String(row.id),
    farmId: String(row.farmId ?? ""),
    cropType: String(row.cropType ?? ""),
    status: (row.status as Season["status"]) ?? "PREPARING",
    startDate: start != null ? toIso(start) : new Date().toISOString(),
    estimatedEndDate: end != null ? toIso(end) : undefined,
    txHash: row.txHash != null && String(row.txHash) !== "" ? String(row.txHash) : null
  };
}

let mockProfile: FarmProfile = {
  id: "farm-001",
  name: "Green Horizon Farm",
  address: "123 Eco Road",
  province: "Lam Dong",
  area: 5.2,
  packageName: "PRO",
  packageExpiryDate: dayjs().add(42, "day").toISOString()
};

let mockSeasons: Season[] = [
  {
    id: "season-001",
    farmId: "farm-001",
    cropType: "Tomato",
    status: "ACTIVE",
    startDate: dayjs().subtract(20, "day").toISOString(),
    estimatedEndDate: dayjs().add(45, "day").toISOString(),
    txHash: null
  },
  {
    id: "season-002",
    farmId: "farm-001",
    cropType: "Lettuce",
    status: "EXPORTED",
    startDate: dayjs().subtract(90, "day").toISOString(),
    estimatedEndDate: dayjs().subtract(10, "day").toISOString(),
    txHash: "0x73fabc9d11d9ab77"
  }
];

let mockSeasonUpdates: SeasonUpdate[] = [
  {
    id: "update-001",
    seasonId: "season-001",
    status: "ACTIVE",
    note: "Irrigation adjusted",
    createdAt: dayjs().subtract(2, "day").toISOString()
  }
];

let mockMarketplace: MarketplaceItem[] = [
  {
    id: "mk-001",
    title: "Premium Tomato Batch",
    quantity: 320,
    unitPrice: 24000,
    description: "Freshly harvested in greenhouse.",
    isActive: true
  }
];

let mockOrders: Order[] = [
  {
    id: "ord-001",
    externalOrderId: "ret-8801",
    retailerId: "retailer-a",
    cropType: "Tomato",
    quantity: 120,
    totalAmount: 2880000,
    status: "PENDING"
  },
  {
    id: "ord-002",
    externalOrderId: "ret-8802",
    retailerId: "retailer-b",
    cropType: "Lettuce",
    quantity: 65,
    totalAmount: 1170000,
    status: "CONFIRMED"
  }
];

const mockPackages: PackageInfo[] = [
  { id: "BASIC", name: "Basic", durationDays: 30, price: 299000 },
  { id: "PRO", name: "Pro", durationDays: 90, price: 799000 },
  { id: "ENTERPRISE", name: "Enterprise", durationDays: 365, price: 2599000 }
];

const mockAlerts: AlertItem[] = [
  {
    id: "a-01",
    title: "TEMP vượt 40°C ở sensor T-03",
    level: "error",
    createdAt: dayjs().subtract(30, "minute").toISOString()
  },
  {
    id: "a-02",
    title: "HUMIDITY thấp hơn 30% tại khu B",
    level: "warning",
    createdAt: dayjs().subtract(2, "hour").toISOString()
  }
];

export const getMyFarms = async (): Promise<{ id: string; name: string }[]> => {
  try {
    const { data } = await gateway.get<unknown>("/farm/farms");
    const list = Array.isArray(data) ? data : [];
    const mapped = (list as Record<string, unknown>[]).map((f) => ({
      id: String(f.id),
      name: String(f.name ?? f.id)
    }));
    if (mapped[0]) cachedFarmId = mapped[0].id;
    return mapped;
  } catch (error) {
    if (useFarmMockFallback()) {
      return [{ id: mockProfile.id, name: mockProfile.name }];
    }
    throw new Error(gatewayErrorMessage(error));
  }
};

export const getFarmProfile = async (): Promise<FarmProfile> => {
  try {
    const { data } = await gateway.get<unknown>("/farm/farms");
    const list = Array.isArray(data) ? data : [];
    if (list.length > 0) {
      const f = list[0] as Record<string, unknown>;
      cachedFarmId = String(f.id);
      return {
        id: String(f.id),
        name: String(f.name ?? ""),
        address: String(f.address ?? ""),
        province: String(f.province ?? ""),
        area: Number(f.area ?? 0),
        packageName: mockProfile.packageName,
        packageExpiryDate: mockProfile.packageExpiryDate
      };
    }
    if (useFarmMockFallback()) {
      return mockProfile;
    }
    throw new Error("Chưa có trang trại trên hệ thống. Hoàn tất Onboarding (tạo farm) trước.");
  } catch (error) {
    if (useFarmMockFallback()) {
      return mockProfile;
    }
    throw error instanceof Error ? error : new Error(gatewayErrorMessage(error));
  }
};

export const saveFarmStepOne = async (payload: Omit<FarmProfile, "id">): Promise<FarmProfile> => {
  try {
    const { data } = await gateway.post("/farm/farms", payload);
    const row = (data as { data?: FarmProfile })?.data ?? (data as FarmProfile);
    mockProfile = row as FarmProfile;
    if (mockProfile.id) cachedFarmId = mockProfile.id;
    return mockProfile;
  } catch (error) {
    if (useFarmMockFallback()) {
      mockProfile = { ...mockProfile, ...payload };
      return mockProfile;
    }
    throw new Error(gatewayErrorMessage(error));
  }
};

export const uploadFarmLicense = async (file: File): Promise<void> => {
  const farmId = cachedFarmId ?? mockProfile.id;
  if (!useFarmMockFallback() && !isLikelyObjectId(farmId)) {
    throw new Error("Chưa có farm hợp lệ để upload giấy phép. Tạo farm và tải lại trang.");
  }
  const form = new FormData();
  form.append("file", file);
  form.append("licenseNumber", `LIC-${Date.now()}`);
  try {
    await gateway.post(`/farm/farms/${farmId}/license`, form);
  } catch (error) {
    if (useFarmMockFallback()) {
      return;
    }
    throw new Error(gatewayErrorMessage(error));
  }
};

export const subscribePackage = async (packageId: string): Promise<{ paymentUrl: string }> => {
  const farmId = cachedFarmId ?? mockProfile.id;
  try {
    const { data } = await gateway.post(`/farm/packages/${packageId}/subscribe`, {
      farmId
    });
    return data as { paymentUrl: string };
  } catch (error) {
    if (useFarmMockFallback()) {
      const target = mockPackages.find((item) => item.id === packageId);
      mockProfile.packageName = target?.name ?? packageId;
      mockProfile.packageExpiryDate = dayjs().add(target?.durationDays ?? 30, "day").toISOString();
      return {
        paymentUrl: "https://sandbox.vnpayment.vn"
      };
    }
    throw new Error(gatewayErrorMessage(error));
  }
};

export const getIotDashboard = async (): Promise<IotDashboard> => {
  const farmId = cachedFarmId ?? mockProfile.id;
  try {
    const { data } = await gateway.get("/iot/sensors/dashboard", {
      params: { farmId }
    });
    return data as IotDashboard;
  } catch (error) {
    if (useFarmMockFallback()) {
      return {
        farmId,
        latest: [
          { type: "TEMP", value: 31.8, unit: "°C", isAlert: false },
          { type: "HUMIDITY", value: 41.2, unit: "%", isAlert: false },
          { type: "PH", value: 5.2, unit: "pH", isAlert: true }
        ],
        totalReadings24h: 268,
        alertReadings24h: 7
      };
    }
    throw new Error(gatewayErrorMessage(error));
  }
};

export const getAlerts = async (): Promise<AlertItem[]> => {
  if (useFarmMockFallback()) {
    return mockAlerts;
  }
  return [];
};

export const getSeasons = async (): Promise<Season[]> => {
  try {
    const { data } = await gateway.get<unknown>("/farm/seasons", { params: { page: 1, limit: 50 } });
    const items = extractSeasonRows(data);
    return items.map((row) => mapApiSeason(row));
  } catch (error) {
    if (useFarmMockFallback()) {
      return mockSeasons;
    }
    throw new Error(gatewayErrorMessage(error));
  }
};

export type CreateSeasonPayload = {
  farmId: string;
  cropType: string;
  startDate: string;
  estimatedEndDate?: string;
};

export const createSeason = async (payload: CreateSeasonPayload): Promise<Season> => {
  const body: Record<string, unknown> = {
    farmId: payload.farmId,
    cropType: payload.cropType,
    startDate: payload.startDate.slice(0, 10)
  };
  if (payload.estimatedEndDate?.trim()) {
    body.estimatedEndDate = payload.estimatedEndDate.slice(0, 10);
  }
  try {
    const { data } = await gateway.post<unknown>("/farm/seasons", body);
    const row = unwrapApiData<Record<string, unknown>>(data);
    return mapApiSeason(row);
  } catch (error: unknown) {
    throw new Error(gatewayErrorMessage(error));
  }
};

export const updateSeason = async (id: string, payload: Partial<Season>): Promise<Season> => {
  try {
    const { data } = await gateway.put<unknown>(`/farm/seasons/${id}`, payload);
    const row = unwrapApiData<Record<string, unknown>>(data);
    return mapApiSeason(row);
  } catch (error) {
    if (useFarmMockFallback()) {
      mockSeasons = mockSeasons.map((item) => (item.id === id ? { ...item, ...payload } : item));
      return mockSeasons.find((item) => item.id === id)!;
    }
    throw new Error(gatewayErrorMessage(error));
  }
};

export const getSeasonUpdates = async (seasonId: string): Promise<SeasonUpdate[]> => {
  if (!isLikelyObjectId(seasonId)) {
    if (useFarmMockFallback()) {
      return mockSeasonUpdates.filter((item) => item.seasonId === seasonId);
    }
    throw new Error("Season ID không hợp lệ (cần Mongo ObjectId 24 ký tự hex).");
  }
  try {
    const { data } = await gateway.get<Record<string, unknown>>(`/farm/seasons/${seasonId}`);
    return (data?.updates ?? []) as SeasonUpdate[];
  } catch (error) {
    if (useFarmMockFallback()) {
      return mockSeasonUpdates.filter((item) => item.seasonId === seasonId);
    }
    throw new Error(gatewayErrorMessage(error));
  }
};

export const addSeasonUpdate = async (seasonId: string, note: string): Promise<void> => {
  if (!isLikelyObjectId(seasonId)) {
    if (useFarmMockFallback()) {
      mockSeasonUpdates = [
        {
          id: `update-${Date.now()}`,
          seasonId,
          status: "ACTIVE",
          note,
          createdAt: new Date().toISOString()
        },
        ...mockSeasonUpdates
      ];
      return;
    }
    throw new Error("Season ID không hợp lệ (cần Mongo ObjectId 24 ký tự hex).");
  }
  try {
    await gateway.post(`/farm/seasons/${seasonId}/updates`, {
      status: "ACTIVE",
      note
    });
  } catch (error) {
    if (useFarmMockFallback()) {
      mockSeasonUpdates = [
        {
          id: `update-${Date.now()}`,
          seasonId,
          status: "ACTIVE",
          note,
          createdAt: new Date().toISOString()
        },
        ...mockSeasonUpdates
      ];
      return;
    }
    throw new Error(gatewayErrorMessage(error));
  }
};

export const exportSeasonPdf = (season: Season): void => {
  const doc = new jsPDF();
  doc.text(`Season Report: ${season.cropType}`, 14, 20);
  doc.text(`Status: ${season.status}`, 14, 30);
  doc.text(`Start: ${dayjs(season.startDate).format("YYYY-MM-DD")}`, 14, 40);
  doc.text(`TxHash: ${season.txHash ?? "Dang ghi blockchain..."}`, 14, 50);
  doc.save(`season-${season.id}.pdf`);
};

export const downloadQr = async (seasonId: string): Promise<void> => {
  try {
    const response = await gateway.get(`/chain/qr/${seasonId}`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${seasonId}.png`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    if (!useFarmMockFallback()) {
      throw new Error(gatewayErrorMessage(error));
    }
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#0f766e";
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = "#ffffff";
      ctx.font = "14px sans-serif";
      ctx.fillText(`QR ${seasonId}`, 60, 100);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `qr-${seasonId}.png`;
      link.click();
    }
  }
};

export const getMarketplace = async (): Promise<MarketplaceItem[]> => {
  try {
    const { data } = await gateway.get("/farm/marketplace/listings/my", {
      params: { page: 1, limit: 50 }
    });
    return (data?.items ?? []) as MarketplaceItem[];
  } catch (error) {
    if (useFarmMockFallback()) {
      return mockMarketplace;
    }
    throw new Error(gatewayErrorMessage(error));
  }
};

/** Payload khớp createListingSchema trên farm-service. */
export type CreateListingPayload = {
  farmId: string;
  seasonId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  description?: string;
};

export const createMarketplace = async (payload: CreateListingPayload): Promise<void> => {
  try {
    await gateway.post("/farm/marketplace/listings", payload);
  } catch (error) {
    if (useFarmMockFallback()) {
      mockMarketplace = [
        {
          id: `mk-${Date.now()}`,
          title: payload.title,
          description: payload.description,
          quantity: payload.quantity,
          unitPrice: payload.unitPrice,
          isActive: true
        },
        ...mockMarketplace
      ];
      return;
    }
    throw new Error(gatewayErrorMessage(error));
  }
};

function mapFarmOrderApiRow(row: Record<string, unknown>): Order {
  const season = row.season as Record<string, unknown> | undefined;
  const cropFromSeason = season && typeof season.cropType === "string" ? season.cropType : "";
  const cropType =
    typeof row.cropType === "string" && row.cropType.trim() !== "" ? String(row.cropType) : cropFromSeason;
  return {
    id: String(row.id),
    externalOrderId: String(row.externalOrderId ?? ""),
    retailerId: String(row.retailerId ?? ""),
    cropType,
    quantity: Number(row.quantity ?? 0),
    totalAmount: Number(row.totalAmount ?? 0),
    status: (row.status as Order["status"]) ?? "PENDING",
    rejectReason: row.rejectReason != null ? String(row.rejectReason) : undefined
  };
}

export const getOrdersByStatus = async (status: OrderStatus): Promise<Order[]> => {
  try {
    const { data } = await gateway.get("/farm/orders", {
      params: { status, page: 1, limit: 100 }
    });
    const raw = (data?.items ?? []) as Record<string, unknown>[];
    return raw.map(mapFarmOrderApiRow);
  } catch (error) {
    if (useFarmMockFallback()) {
      return mockOrders.filter((item) => item.status === status);
    }
    throw new Error(gatewayErrorMessage(error));
  }
};

export const confirmOrder = async (id: string): Promise<void> => {
  try {
    await gateway.put(`/farm/orders/${id}/confirm`);
  } catch (error) {
    if (useFarmMockFallback()) {
      mockOrders = mockOrders.map((item) => (item.id === id ? { ...item, status: "CONFIRMED" } : item));
      return;
    }
    throw new Error(gatewayErrorMessage(error));
  }
};

export const rejectOrder = async (id: string, rejectReason: string): Promise<void> => {
  try {
    await gateway.put(`/farm/orders/${id}/reject`, { rejectReason });
  } catch (error) {
    if (useFarmMockFallback()) {
      mockOrders = mockOrders.map((item) => (item.id === id ? { ...item, status: "REJECTED", rejectReason } : item));
      return;
    }
    throw new Error(gatewayErrorMessage(error));
  }
};

export const getPackages = async (): Promise<PackageInfo[]> => {
  try {
    const { data } = await gateway.get("/farm/packages");
    return data as PackageInfo[];
  } catch (error) {
    if (useFarmMockFallback()) {
      return mockPackages;
    }
    throw new Error(gatewayErrorMessage(error));
  }
};

export const getCurrentPackage = async (): Promise<{ packageName: string; expiryDate: string }> => {
  const farmId = cachedFarmId ?? mockProfile.id;
  if (!isLikelyObjectId(farmId)) {
    if (useFarmMockFallback()) {
      return {
        packageName: mockProfile.packageName ?? "PRO",
        expiryDate: mockProfile.packageExpiryDate ?? dayjs().add(30, "day").toISOString()
      };
    }
    throw new Error("Chưa có farm hợp lệ để xem gói cước. Hoàn tất Onboarding trước.");
  }

  try {
    const { data } = await gateway.get("/farm/packages/my", { params: { farmId } });
    return {
      packageName: data?.subscription?.packageName ?? mockProfile.packageName ?? "PRO",
      expiryDate: data?.expiryDate ?? mockProfile.packageExpiryDate ?? dayjs().add(30, "day").toISOString()
    };
  } catch (error) {
    if (useFarmMockFallback()) {
      return {
        packageName: mockProfile.packageName ?? "PRO",
        expiryDate: mockProfile.packageExpiryDate ?? dayjs().add(30, "day").toISOString()
      };
    }
    throw new Error(gatewayErrorMessage(error));
  }
};
