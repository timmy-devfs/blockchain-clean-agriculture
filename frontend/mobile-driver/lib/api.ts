import axios from "axios";
import * as SecureStore from "expo-secure-store";
import type { ApiResponse, PageResponse } from "@bicap/types";

// ─── Token keys ───────────────────────────────────────────────────────────
export const TOKEN_KEY   = "bicap_access_token";
export const REFRESH_KEY = "bicap_refresh_token";
export const EMAIL_KEY   = "bicap_remember_email";

// ─── Axios instance cho mobile ────────────────────────────────────────────
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: gắn JWT
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: tự refresh khi 401
let isRefreshing = false;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
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

// ─── Types ────────────────────────────────────────────────────────────────
export interface DriverUser {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  avatarUrl?: string;
}

export interface ShipmentListItem {
  id: string;
  orderId: string;
  farmName: string;
  farmAddress: string;
  farmPhone: string;
  retailerName: string;
  retailerAddress: string;
  retailerPhone: string;
  deliveryAddress: string;
  status: string;
  scheduledDate: string;
  estimatedDelivery: string;
  createdAt: string;
}

export interface ShipmentDetail extends ShipmentListItem {
  statusHistory: {
    id: string;
    status: string;
    note?: string;
    location?: string;
    createdAt: string;
  }[];
}

// ─── API calls ────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: DriverUser }>>(
      "/api/auth/login",
      { email, password }
    ).then((r) => r.data.data),

  getMe: () =>
    api.get<ApiResponse<DriverUser>>("/api/auth/me").then((r) => r.data.data),
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
};