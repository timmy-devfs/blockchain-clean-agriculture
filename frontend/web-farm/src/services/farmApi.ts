import axios from "axios";
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

const farmClient = axios.create({
  baseURL: import.meta.env.VITE_FARM_API_BASE_URL ?? "http://localhost:8082",
  timeout: 6000
});

const iotClient = axios.create({
  baseURL: import.meta.env.VITE_IOT_API_BASE_URL ?? "http://localhost:8087",
  timeout: 6000
});

const chainClient = axios.create({
  baseURL: import.meta.env.VITE_CHAIN_API_BASE_URL ?? "http://localhost:8090",
  timeout: 6000
});

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

export const getFarmProfile = async (): Promise<FarmProfile> => {
  try {
    const { data } = await farmClient.get("/api/farm/farms");
    if (Array.isArray(data) && data.length > 0) {
      return data[0] as FarmProfile;
    }
    return mockProfile;
  } catch {
    return mockProfile;
  }
};

export const saveFarmStepOne = async (payload: Omit<FarmProfile, "id">): Promise<FarmProfile> => {
  try {
    const { data } = await farmClient.post("/api/farm/farms", payload);
    mockProfile = data as FarmProfile;
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
    await farmClient.post(`/api/farm/farms/${mockProfile.id}/license`, form);
  } catch {
    return;
  }
};

export const subscribePackage = async (packageId: string): Promise<{ paymentUrl: string }> => {
  try {
    const { data } = await farmClient.post(`/api/farm/packages/${packageId}/subscribe`, {
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
    const { data } = await iotClient.get("/api/iot/sensors/dashboard", {
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
    const { data } = await farmClient.get("/api/farm/seasons", { params: { page: 1, limit: 50 } });
    if (Array.isArray(data?.items)) {
      return data.items as Season[];
    }
    return mockSeasons;
  } catch {
    return mockSeasons;
  }
};

export const createSeason = async (payload: Omit<Season, "id" | "txHash">): Promise<Season> => {
  try {
    const { data } = await farmClient.post("/api/farm/seasons", payload);
    return data as Season;
  } catch {
    const newSeason: Season = { ...payload, id: `season-${Date.now()}`, txHash: null };
    mockSeasons = [newSeason, ...mockSeasons];
    return newSeason;
  }
};

export const updateSeason = async (id: string, payload: Partial<Season>): Promise<Season> => {
  try {
    const { data } = await farmClient.put(`/api/farm/seasons/${id}`, payload);
    return data as Season;
  } catch {
    mockSeasons = mockSeasons.map((item) => (item.id === id ? { ...item, ...payload } : item));
    return mockSeasons.find((item) => item.id === id)!;
  }
};

export const getSeasonUpdates = async (seasonId: string): Promise<SeasonUpdate[]> => {
  try {
    const { data } = await farmClient.get(`/api/farm/seasons/${seasonId}`);
    return (data?.updates ?? []) as SeasonUpdate[];
  } catch {
    return mockSeasonUpdates.filter((item) => item.seasonId === seasonId);
  }
};

export const addSeasonUpdate = async (seasonId: string, note: string): Promise<void> => {
  try {
    await farmClient.post(`/api/farm/seasons/${seasonId}/updates`, {
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
    const response = await chainClient.get(`/api/chain/qr/${seasonId}`, { responseType: "blob" });
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
    const { data } = await farmClient.get("/api/farm/marketplace/listings/my", {
      params: { page: 1, limit: 50 }
    });
    return (data?.items ?? []) as MarketplaceItem[];
  } catch {
    return mockMarketplace;
  }
};

export const createMarketplace = async (payload: Omit<MarketplaceItem, "id" | "isActive">): Promise<void> => {
  try {
    await farmClient.post("/api/farm/marketplace/listings", payload);
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
    const { data } = await farmClient.get("/api/farm/orders", {
      params: { status, page: 1, limit: 100 }
    });
    return (data?.items ?? []) as Order[];
  } catch {
    return mockOrders.filter((item) => item.status === status);
  }
};

export const confirmOrder = async (id: string): Promise<void> => {
  try {
    await farmClient.put(`/api/farm/orders/${id}/confirm`);
  } catch {
    mockOrders = mockOrders.map((item) => (item.id === id ? { ...item, status: "CONFIRMED" } : item));
  }
};

export const rejectOrder = async (id: string, rejectReason: string): Promise<void> => {
  try {
    await farmClient.put(`/api/farm/orders/${id}/reject`, { rejectReason });
  } catch {
    mockOrders = mockOrders.map((item) => (item.id === id ? { ...item, status: "REJECTED", rejectReason } : item));
  }
};

export const getPackages = async (): Promise<PackageInfo[]> => {
  try {
    const { data } = await farmClient.get("/api/farm/packages");
    return data as PackageInfo[];
  } catch {
    return mockPackages;
  }
};

export const getCurrentPackage = async (): Promise<{ packageName: string; expiryDate: string }> => {
  try {
    const { data } = await farmClient.get("/api/farm/packages/my", { params: { farmId: mockProfile.id } });
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
