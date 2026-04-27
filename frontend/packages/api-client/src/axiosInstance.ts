import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { tokenStorage } from "./tokenStorage";
import type { ApiResponse, AuthTokens } from "@bicap/types";

// Mở rộng InternalAxiosRequestConfig để thêm cờ _retry hỗ trợ việc refresh token.
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// ─── Tạo axios instance trỏ đến API Gateway ───────────────────────────────
const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor: gắn JWT vào mỗi request ─────────────────────────
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// ─── Flag ngăn refresh loop khi refresh token cũng lỗi ────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

// ─── Response interceptor: tự động refresh khi nhận 401 ───────────────────
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig | undefined;

    // Chỉ xử lý 401 và chưa retry, kiểm tra originalRequest tồn tại
    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Nếu đang refresh, queue request lại chờ token mới
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    try {
      // Gọi API refresh — không dùng axiosInstance để tránh loop
      const { data } = await axios.post<ApiResponse<AuthTokens>>(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api"}/api/auth/refresh-token`,
        { refreshToken }
      );

      const { accessToken, refreshToken: newRefreshToken } = data.data;
      tokenStorage.setTokens(accessToken, newRefreshToken);
      processQueue(null, accessToken);

      // Retry original request với token mới
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      tokenStorage.clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;