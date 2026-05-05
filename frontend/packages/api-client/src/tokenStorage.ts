// Quản lý lưu trữ JWT tokens trong localStorage + cookie để middleware Edge Runtime đọc được.
const ACCESS_TOKEN_KEY = "bicap_access_token";
const REFRESH_TOKEN_KEY = "bicap_refresh_token";

// Cookie sống đủ dài để bao trọn 1 phiên làm việc (8h). Refresh token sẽ tự xoay vòng.
const ACCESS_COOKIE_MAX_AGE_SEC = 60 * 60 * 8;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const needle = `${name}=`;
  const parts = document.cookie.split(";").map((x) => x.trim());
  const hit = parts.find((p) => p.startsWith(needle));
  return hit ? decodeURIComponent(hit.slice(needle.length)) : null;
}

function writeAccessCookie(token: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ACCESS_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${ACCESS_COOKIE_MAX_AGE_SEC}; SameSite=Strict`;
}

function clearAccessCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; SameSite=Strict`;
}

export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null;
    // Ưu tiên cookie (nguồn duy nhất mà middleware Edge Runtime đọc được).
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
    // Đồng bộ cookie để middleware Edge Runtime nhận diện ngay session mới
    // (kể cả khi user chỉ đổi tab / soft-navigate).
    writeAccessCookie(accessToken);
  },

  clearTokens: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    clearAccessCookie();
  },
};
