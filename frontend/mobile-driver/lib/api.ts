import axios from "axios";
import * as SecureStore from "expo-secure-store";
import type { ApiResponse, PageResponse } from "@bicap/types";

export const TOKEN_KEY = "bicap_access_token";
export const REFRESH_KEY = "bicap_refresh_token";
export const EMAIL_KEY = "bicap_remember_email";

// ─── TÍCH HỢP MOCK DB CHO CHẾ ĐỘ TEST ─────────────────────────────────────
export const isMockMode = true;

const MOCK_DB = {
  users: [
    {
      email: "driver@bicap.vn",
      password: "123123",
      user: {
        id: "D-1",
        fullName: "Tài xế Nguyễn Trung Hậu",
        phone: "0901234567",
        email: "driver@bicap.vn",
        avatarUrl: "https://i.pravatar.cc/150?u=driver",
      }
    }
  ]
};
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
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

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
    return api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: DriverUser }>>(
      "/api/auth/login", { email, password }
    ).then((r) => r.data.data);
  },

  getMe: async () => {
    if (isMockMode) return MOCK_DB.users[0].user;
    return api.get<ApiResponse<DriverUser>>("/api/auth/me").then((r) => r.data.data);
  },
};

export const shipmentApi = {
  getList: (params?: { status?: string; date?: string; page?: number; size?: number }) =>
    api.get<ApiResponse<PageResponse<ShipmentListItem>>>(
      "/api/shipping/driver/shipments",
      { params: { ...params, size: params?.size ?? 10 } }
    ).then((r) => r.data.data),

  getDetail: (id: string) =>
    api.get<ApiResponse<ShipmentDetail>>(
      `/api/shipping/driver/shipments/${id}`
    ).then((r) => r.data.data),

  pickup: async (shipmentId: string, qrCode: string, photoUri: string) => {
    const formData = new FormData();
    formData.append("qrCode", qrCode);
    formData.append("image", { uri: photoUri, name: "pickup_proof.jpg", type: "image/jpeg" } as any);
    return api.post<ApiResponse<any>>(
      `/api/shipping/driver/shipments/${shipmentId}/pickup`, formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    ).then((r) => r.data);
  },

  deliver: async (shipmentId: string, recipientName: string, photoUri: string) => {
    const formData = new FormData();
    formData.append("recipientName", recipientName);
    formData.append("image", { uri: photoUri, name: "deliver_proof.jpg", type: "image/jpeg" } as any);
    return api.post<ApiResponse<any>>(
      `/api/shipping/driver/shipments/${shipmentId}/deliver`, formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    ).then((r) => r.data);
  },
};