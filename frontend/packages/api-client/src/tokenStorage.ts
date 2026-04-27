// Quản lý lưu trữ JWT tokens trong localStorage
const ACCESS_TOKEN_KEY = "bicap_access_token";
const REFRESH_TOKEN_KEY = "bicap_refresh_token";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const needle = `${name}=`;
  const parts = document.cookie.split(";").map((x) => x.trim());
  const hit = parts.find((p) => p.startsWith(needle));
  return hit ? decodeURIComponent(hit.slice(needle.length)) : null;
}

export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null;
    // Admin app stores access token in cookie for middleware;
    // prefer cookie first to avoid cross-app localStorage token collisions.
    const cookieToken = readCookie(ACCESS_TOKEN_KEY);
    if (cookieToken) return cookieToken;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clearTokens: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};