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
    const { data } = await gateway.get<unknown>("/api/farm/farms");
    const list = Array.isArray(data) ? data : [];
    return (list as Record<string, unknown>[]).map((f) => ({
      id: String(f.id),
      name: String(f.name ?? f.id)
    }));
  } catch {
    return [{ id: mockProfile.id, name: mockProfile.name }];
  }
};

export const getFarmProfile = async (): Promise<FarmProfile> => {
  try {
    const { data } = await gateway.get<unknown>("/api/farm/farms");
    const list = Array.isArray(data) ? data : [];
    if (list.length > 0) {
      const f = list[0] as Record<string, unknown>;
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
    return mockProfile;
  } catch {
    return mockProfile;
  }
};

export const saveFarmStepOne = async (payload: Omit<FarmProfile, "id">): Promise<FarmProfile> => {
  try {
    const { data } = await gateway.post("/api/farm/farms", payload);
    const row = (data as { data?: FarmProfile })?.data ?? (data as FarmProfile);
    mockProfile = row as FarmProfile;
    return mockProfile;
  } catch {
    mockProfile = { ...mockProfile, ...payload };
    return mockProfile;
  }
};

export const uploadFarmLicense = async (file: File): Promise<void> => {
  const form = new FormData();
  form.append("file", file);
  form.append("licenseNumber", `LIC-${Date.now()}`);
  try {
    await gateway.post(`/api/farm/farms/${mockProfile.id}/license`, form);
  } catch {
    return;
  }
};

export const subscribePackage = async (packageId: string): Promise<{ paymentUrl: string }> => {
  try {
    const { data } = await gateway.post(`/api/farm/packages/${packageId}/subscribe`, {
      farmId: mockProfile.id
    });
    return data as { paymentUrl: string };
  } catch {
    const target = mockPackages.find((item) => item.id === packageId);
    mockProfile.packageName = target?.name ?? packageId;
    mockProfile.packageExpiryDate = dayjs().add(target?.durationDays ?? 30, "day").toISOString();
    return {
      paymentUrl: "https://sandbox.vnpayment.vn"
    };
  }
};

export const getIotDashboard = async (): Promise<IotDashboard> => {
  try {
    const { data } = await gateway.get("/api/iot/sensors/dashboard", {
      params: { farmId: mockProfile.id }
    });
    return data as IotDashboard;
  } catch {
    return {
      farmId: mockProfile.id,
      latest: [
        { type: "TEMP", value: 31.8, unit: "°C", isAlert: false },
        { type: "HUMIDITY", value: 41.2, unit: "%", isAlert: false },
        { type: "PH", value: 5.2, unit: "pH", isAlert: true }
      ],
      totalReadings24h: 268,
      alertReadings24h: 7
    };
  }
};

export const getAlerts = async (): Promise<AlertItem[]> => {
  return mockAlerts;
};

export const getSeasons = async (): Promise<Season[]> => {
  try {
    const { data } = await gateway.get<unknown>("/api/farm/seasons", { params: { page: 1, limit: 50 } });
    const inner = data as { items?: unknown[] };
    const items = Array.isArray(inner?.items) ? inner.items : [];
    if (items.length === 0) {
      return mockSeasons;
    }
    return (items as Record<string, unknown>[]).map((row) => mapApiSeason(row));
  } catch {
    return mockSeasons;
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
    const { data } = await gateway.post<unknown>("/api/farm/seasons", body);
    return mapApiSeason(data as Record<string, unknown>);
  } catch {
    const newSeason: Season = {
      id: `season-${Date.now()}`,
      farmId: payload.farmId,
      cropType: payload.cropType,
      status: "PREPARING",
      startDate: new Date(payload.startDate).toISOString(),
      estimatedEndDate: payload.estimatedEndDate
        ? new Date(payload.estimatedEndDate).toISOString()
        : undefined,
      txHash: null
    };
    mockSeasons = [newSeason, ...mockSeasons];
    return newSeason;
  }
};

export const updateSeason = async (id: string, payload: Partial<Season>): Promise<Season> => {
  try {
    const { data } = await gateway.put<unknown>(`/api/farm/seasons/${id}`, payload);
    return mapApiSeason(data as Record<string, unknown>);
  } catch {
    mockSeasons = mockSeasons.map((item) => (item.id === id ? { ...item, ...payload } : item));
    return mockSeasons.find((item) => item.id === id)!;
  }
};

export const getSeasonUpdates = async (seasonId: string): Promise<SeasonUpdate[]> => {
  // Mock season IDs like "season-001" are not valid backend IDs.
  if (!isLikelyObjectId(seasonId)) {
    return mockSeasonUpdates.filter((item) => item.seasonId === seasonId);
  }
  try {
    const { data } = await gateway.get<Record<string, unknown>>(`/api/farm/seasons/${seasonId}`);
    return (data?.updates ?? []) as SeasonUpdate[];
  } catch {
    return mockSeasonUpdates.filter((item) => item.seasonId === seasonId);
  }
};

export const addSeasonUpdate = async (seasonId: string, note: string): Promise<void> => {
  if (!isLikelyObjectId(seasonId)) {
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
  try {
    await gateway.post(`/api/farm/seasons/${seasonId}/updates`, {
      status: "ACTIVE",
      note
    });
  } catch {
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
    const response = await gateway.get(`/api/chain/qr/${seasonId}`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${seasonId}.png`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
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
    const { data } = await gateway.get("/api/farm/marketplace/listings/my", {
      params: { page: 1, limit: 50 }
    });
    return (data?.items ?? []) as MarketplaceItem[];
  } catch {
    return mockMarketplace;
  }
};

export const createMarketplace = async (payload: Omit<MarketplaceItem, "id" | "isActive">): Promise<void> => {
  try {
    await gateway.post("/api/farm/marketplace/listings", payload);
  } catch {
    mockMarketplace = [
      {
        ...payload,
        id: `mk-${Date.now()}`,
        isActive: true
      },
      ...mockMarketplace
    ];
  }
};

export const getOrdersByStatus = async (status: OrderStatus): Promise<Order[]> => {
  try {
    const { data } = await gateway.get("/api/farm/orders", {
      params: { status, page: 1, limit: 100 }
    });
    return (data?.items ?? []) as Order[];
  } catch {
    return mockOrders.filter((item) => item.status === status);
  }
};

export const confirmOrder = async (id: string): Promise<void> => {
  try {
    await gateway.put(`/api/farm/orders/${id}/confirm`);
  } catch {
    mockOrders = mockOrders.map((item) => (item.id === id ? { ...item, status: "CONFIRMED" } : item));
  }
};

export const rejectOrder = async (id: string, rejectReason: string): Promise<void> => {
  try {
    await gateway.put(`/api/farm/orders/${id}/reject`, { rejectReason });
  } catch {
    mockOrders = mockOrders.map((item) => (item.id === id ? { ...item, status: "REJECTED", rejectReason } : item));
  }
};

export const getPackages = async (): Promise<PackageInfo[]> => {
  try {
    const { data } = await gateway.get("/api/farm/packages");
    return data as PackageInfo[];
  } catch {
    return mockPackages;
  }
};

export const getCurrentPackage = async (): Promise<{ packageName: string; expiryDate: string }> => {
  if (!isLikelyObjectId(mockProfile.id)) {
    return {
      packageName: mockProfile.packageName ?? "PRO",
      expiryDate: mockProfile.packageExpiryDate ?? dayjs().add(30, "day").toISOString()
    };
  }

  try {
    const { data } = await gateway.get("/api/farm/packages/my", { params: { farmId: mockProfile.id } });
    return {
      packageName: data?.subscription?.packageName ?? mockProfile.packageName ?? "PRO",
      expiryDate: data?.expiryDate ?? mockProfile.packageExpiryDate ?? dayjs().add(30, "day").toISOString()
    };
  } catch {
    return {
      packageName: mockProfile.packageName ?? "PRO",
      expiryDate: mockProfile.packageExpiryDate ?? dayjs().add(30, "day").toISOString()
    };
  }
};
