import axios from "axios";

const ACCESS_TOKEN_KEY = "bicap_access_token";
const REFRESH_TOKEN_KEY = "bicap_refresh_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string | null): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** Axios client tới API Gateway — gắn Bearer, 401 thì xóa token và reload (về màn login). */
export const gateway = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

gateway.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

gateway.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = String(error?.config?.url ?? "");
    const isPublicAuth =
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/register") ||
      url.includes("/api/auth/refresh-token");
    if (error?.response?.status === 401 && !isPublicAuth) {
      clearTokens();
      window.location.reload();
    }
    return Promise.reject(error);
  },
);
