export type SensorType = "TEMP" | "HUMIDITY" | "PH";

export type IotLatestItem = {
  type: SensorType;
  value: number;
  unit: string;
  isAlert: boolean;
};

export type IotDashboard = {
  farmId: string;
  latest: IotLatestItem[];
  totalReadings24h: number;
  alertReadings24h: number;
};

export type FarmProfile = {
  id: string;
  name: string;
  address: string;
  province: string;
  area: number;
  licenseNumber?: string;
  packageName?: string;
  packageExpiryDate?: string;
};

export type Season = {
  id: string;
  farmId: string;
  cropType: string;
  status: "PREPARING" | "ACTIVE" | "HARVESTED" | "EXPORTED";
  startDate: string;
  estimatedEndDate?: string;
  txHash: string | null;
};

export type SeasonUpdate = {
  id: string;
  seasonId: string;
  status: string;
  note?: string;
  createdAt: string;
};

export type MarketplaceItem = {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  isActive: boolean;
};

export type OrderStatus = "PENDING" | "CONFIRMED" | "REJECTED";

export type Order = {
  id: string;
  externalOrderId: string;
  retailerId: string;
  cropType: string;
  quantity: number;
  totalAmount: number;
  status: OrderStatus;
  rejectReason?: string;
};

export type PackageInfo = {
  id: string;
  name: string;
  durationDays: number;
  price: number;
};

export type AlertItem = {
  id: string;
  title: string;
  level: "warning" | "error";
  createdAt: string;
};
