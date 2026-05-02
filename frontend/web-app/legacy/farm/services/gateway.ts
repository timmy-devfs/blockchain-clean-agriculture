import axios from "axios";

const ACCESS_TOKEN_KEY = "bicap_access_token";
const REFRESH_TOKEN_KEY = "bicap_refresh_token";

/**
 * Trùng khóa env với web-app: `NEXT_PUBLIC_API_URL` đã là gateway mount (vd. `http://localhost/api`).
 * Mọi request dùng path tương đối `/farm/...`, `/auth/...` — không lặp `/api/api`.
 */
function gatewayBaseUrlFromEnv(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api").replace(/\/+$/, "");
}

const GATEWAY_BASE_URL = gatewayBaseUrlFromEnv();

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

let isRedirecting = false;

gateway.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = String(error?.config?.url ?? "");
    const isPublicAuth =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh-token");
    const onLoginPage =
      typeof window !== "undefined" &&
      (window.location.pathname === "/login" || window.location.pathname.startsWith("/login/"));

    if (
      error?.response?.status === 401 &&
      !isPublicAuth &&
      typeof window !== "undefined" &&
      !onLoginPage &&
      !isRedirecting
    ) {
      clearTokens();
      isRedirecting = true;
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
