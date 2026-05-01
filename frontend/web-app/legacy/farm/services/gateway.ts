import axios from "axios";

const ACCESS_TOKEN_KEY = "bicap_access_token";
const REFRESH_TOKEN_KEY = "bicap_refresh_token";

/**
 * Origin gateway: **không** có hậu tố `/api` vì mọi request dùng path đầy đủ `/api/...`.
 * Trùng logic với `packages/api-client/src/axiosInstance.ts` để tránh `.../api/api/auth/me`.
 */
function gatewayOriginFromEnv(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api").replace(/\/+$/, "");
  if (raw.endsWith("/api")) {
    return raw.slice(0, -4);
  }
  return raw;
}

const GATEWAY_BASE_URL = gatewayOriginFromEnv();

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

/** Axios client tới API Gateway — gắn Bearer; 401 → xóa token và redirect /login một lần. */
export const gateway = axios.create({
  baseURL: GATEWAY_BASE_URL,
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

let isRedirectingToLogin = false;

gateway.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = String(error?.config?.url ?? "");
    const isPublicAuth =
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/register") ||
      url.includes("/api/auth/refresh-token");
    const onLoginPage =
      typeof window !== "undefined" &&
      (window.location.pathname === "/login" || window.location.pathname.startsWith("/login/"));

    if (
      error?.response?.status === 401 &&
      !isPublicAuth &&
      typeof window !== "undefined" &&
      !onLoginPage &&
      !isRedirectingToLogin
    ) {
      clearTokens();
      isRedirectingToLogin = true;
      window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);
