import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { ApiResponse, PageResponse } from "@bicap/types";

export const TOKEN_KEY = "bicap_access_token";
export const REFRESH_KEY = "bicap_refresh_token";
export const EMAIL_KEY = "bicap_remember_email";
/** UUID người dùng — lưu sau login để đăng ký FCM kèm userId */
export const USER_ID_KEY = "bicap_user_id";

// ─── TÍCH HỢP MOCK DB CHO CHẾ ĐỘ TEST ─────────────────────────────────────
export const isMockMode = process.env.EXPO_PUBLIC_USE_MOCK === "true";

const MOCK_DB = {
  users: [
    {
      email: "driver@bicap.io",
      password: "password",
      user: {
        id: "a0000001-0001-4001-8001-000000000001",
        fullName: "Tai xe demo BICAP",
        phone: "0900000001",
        email: "driver@bicap.io",
        avatarUrl: "https://i.pravatar.cc/150?u=driver",
      }
    }
  ]
};

const MOCK_SHIPPING_ROWS: ShippingApiShipment[] = [
  {
    id: 9001,
    orderId: 8801,
    farmId: 10,
    retailerId: 20,
    driverId: 1,
    vehicleId: 1,
    status: "ASSIGNED",
    pickupAddress: "Kho Long An (mock)",
    deliveryAddress: "Q1 TP.HCM (mock)",
    scheduledDate: new Date().toISOString().slice(0, 10),
  },
];
// ──────────────────────────────────────────────────────────────────────────

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error);
    if (isRefreshing) return Promise.reject(error);

    original._retry = true;
    isRefreshing = true;
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        `${API_URL}/api/auth/refresh-token`,
        { refreshToken }
      );
      await SecureStore.setItemAsync(TOKEN_KEY, data.data.accessToken);
      await SecureStore.setItemAsync(REFRESH_KEY, data.data.refreshToken);

      original.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return api(original);
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
      await SecureStore.deleteItemAsync(USER_ID_KEY);
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

function assertShippingOk<T>(res: ApiResponse<T>): T {
  if (res.code !== 200) {
    throw new Error(res.message || "Shipping API loi");
  }
  return res.data;
}

/**
 * POST /api/notify/tokens — Bearer bắt buộc (axios interceptor).
 * Gọi sau khi login khi đã có TOKEN_KEY và USER_ID_KEY (useAuth set trước khi gọi).
 */
export async function syncFcmTokenToBackend(fcmToken: string): Promise<void> {
  if (isMockMode) return;
  const jwt = await SecureStore.getItemAsync(TOKEN_KEY);
  const userId = await SecureStore.getItemAsync(USER_ID_KEY);
  if (!jwt?.trim() || !userId?.trim()) return;
  const platform = Platform.OS === "ios" ? "IOS" : "ANDROID";
  await api.post("/api/notify/tokens", {
    token: fcmToken,
    deviceType: "MOBILE",
    platform,
    userId,
  });
}

export interface DriverUser {
  id: string; fullName: string; phone: string; email: string; avatarUrl?: string;
}

export interface ShipmentListItem {
  id: string; orderId: string; farmName: string; farmAddress: string; farmPhone: string;
  retailerName: string; retailerAddress: string; retailerPhone: string;
  deliveryAddress: string; status: string; scheduledDate: string;
  estimatedDelivery: string; createdAt: string;
}

export interface ShipmentDetail extends ShipmentListItem {
  statusHistory: { id: string; status: string; note?: string; location?: string; createdAt: string; }[];
}

type ShippingApiShipment = {
  id: number;
  orderId: number | null;
  farmId: number | null;
  retailerId: number | null;
  driverId: number | null;
  vehicleId: number | null;
  status: string;
  pickupAddress: string | null;
  deliveryAddress: string | null;
  scheduledDate: string | null;
};

type ShippingHistory = {
  id: number;
  status: string;
  note: string | null;
  changedAt: string;
};

const statusMap: Record<string, string> = {
  CREATED: "ASSIGNED",
  ASSIGNED: "ASSIGNED",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "IN_TRANSIT",
  DELAYED: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

function normalizeStatus(value: string | undefined): string {
  if (!value) return "ASSIGNED";
  return statusMap[value] ?? value;
}

function mapShipmentRow(row: ShippingApiShipment): ShipmentListItem {
  const scheduled = row.scheduledDate
    ? new Date(`${row.scheduledDate}T08:00:00.000Z`).toISOString()
    : new Date().toISOString();

  return {
    id: String(row.id),
    orderId: String(row.orderId ?? ""),
    farmName: `Farm #${row.farmId ?? "N/A"}`,
    farmAddress: row.pickupAddress ?? "Chưa có địa chỉ lấy hàng",
    farmPhone: "N/A",
    retailerName: `Retailer #${row.retailerId ?? "N/A"}`,
    retailerAddress: row.deliveryAddress ?? "Chưa có địa chỉ giao",
    retailerPhone: "N/A",
    deliveryAddress: row.deliveryAddress ?? "Chưa có địa chỉ giao",
    status: normalizeStatus(row.status),
    scheduledDate: scheduled,
    estimatedDelivery: scheduled,
    createdAt: scheduled,
  };
}

function mapHistoryRows(rows: ShippingHistory[]) {
  return rows.map((h) => ({
    id: String(h.id),
    status: normalizeStatus(h.status),
    note: h.note ?? undefined,
    createdAt: h.changedAt,
  }));
}

export const authApi = {
  login: async (email: string, password: string) => {
    if (isMockMode) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const foundUser = MOCK_DB.users.find(u => u.email === email && u.password === password);
      if (foundUser) {
        return {
          accessToken: "mock_jwt_access_token_header.payload.signature",
          refreshToken: "mock_jwt_refresh_token_abc123",
          user: foundUser.user
        };
      }
      throw new Error("Invalid credentials");
    }
    return api
      .post<ApiResponse<{ accessToken: string; refreshToken: string; user: DriverUser }>>("/api/auth/login", {
        email,
        password,
      })
      .then((r) => {
        if (r.data.code !== 200) throw new Error(r.data.message || "Dang nhap that bai");
        return r.data.data;
      });
  },

  getMe: async () => {
    if (isMockMode) return MOCK_DB.users[0].user;
    const r = await api.get<
      ApiResponse<{
        id: string;
        email: string;
        fullName: string;
        phone?: string | null;
        avatarUrl?: string | null;
      }>
    >("/api/auth/me");
    if (r.data.code !== 200) throw new Error(r.data.message || "Khong lay duoc profile");
    const u = r.data.data;
    return {
      id: u.id,
      fullName: u.fullName,
      phone: u.phone ?? "",
      email: u.email,
      avatarUrl: u.avatarUrl ?? undefined,
    } satisfies DriverUser;
  },
};

export const shipmentApi = {
  getList: async (params?: { status?: string; date?: string; page?: number; size?: number }) => {
    let rows: ShipmentListItem[];
    if (isMockMode) {
      rows = MOCK_SHIPPING_ROWS.map(mapShipmentRow);
    } else {
      const r = await api.get<ApiResponse<ShippingApiShipment[]>>("/api/shipping/driver/shipments");
      rows = (assertShippingOk(r.data) ?? []).map(mapShipmentRow);
    }
    const status = params?.status;
    const filtered = status ? rows.filter((x) => x.status === status) : rows;
    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    const start = page * size;
    return {
      data: filtered.slice(start, start + size),
      total: filtered.length,
      page,
      size,
      totalPages: filtered.length === 0 ? 0 : Math.ceil(filtered.length / size),
    } as PageResponse<ShipmentListItem>;
  },

  getDetail: (id: string) => {
    if (isMockMode) {
      const row = MOCK_SHIPPING_ROWS.find((r) => String(r.id) === id);
      if (!row) return Promise.reject(new Error("Not found"));
      return Promise.resolve({
        ...mapShipmentRow(row),
        statusHistory: [],
      } as ShipmentDetail);
    }
    return Promise.all([
      api.get<ApiResponse<ShippingApiShipment>>(`/api/shipping/driver/shipments/${id}`),
      api.get<ApiResponse<ShippingHistory[]>>(`/api/shipping/driver/shipments/${id}/history`),
    ]).then(([shipmentRes, historyRes]) => {
      const shipmentBody = shipmentRes.data;
      if (shipmentBody.code !== 200) throw new Error(shipmentBody.message);
      const base = mapShipmentRow(shipmentBody.data);
      const histBody = historyRes.data;
      const hist = histBody.code === 200 ? histBody.data ?? [] : [];
      return {
        ...base,
        statusHistory: mapHistoryRows(hist),
      } as ShipmentDetail;
    });
  },

  pickup: async (shipmentId: string, qrCode: string, photoUri: string) => {
    return api.post<ApiResponse<any>>(
      `/api/shipping/driver/shipments/${shipmentId}/pickup`,
      { status: "PICKED_UP", note: `QR: ${qrCode}`, imageUrl: photoUri }
    ).then((r) => r.data);
  },

  deliver: async (shipmentId: string, recipientName: string, photoUri: string) => {
    return api.post<ApiResponse<any>>(
      `/api/shipping/driver/shipments/${shipmentId}/status`,
      { status: "DELIVERED", note: `Delivered to: ${recipientName}`, imageUrl: photoUri }
    ).then((r) => r.data);
  },
};