import { gateway, clearTokens, setTokens } from "./gateway";

export type FarmMeUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  createdAt?: string;
};

function unwrap<T>(body: unknown): T {
  if (body != null && typeof body === "object" && "data" in body) {
    const d = (body as { data: unknown }).data;
    if (d !== undefined) return d as T;
  }
  return body as T;
}

export async function loginWithPassword(email: string, password: string): Promise<void> {
  clearTokens();
  const { data } = await gateway.post("/api/auth/login", { email, password });
  const inner = unwrap<{ accessToken: string; refreshToken?: string }>(data);
  if (!inner?.accessToken) {
    throw new Error("Invalid login response");
  }
  setTokens(inner.accessToken, inner.refreshToken ?? null);
}

export async function fetchMe(): Promise<FarmMeUser> {
  const { data } = await gateway.get("/api/auth/me");
  return unwrap<FarmMeUser>(data);
}

export function logoutFarm(): void {
  clearTokens();
  if (typeof window !== "undefined") {
    // Điều hướng tới /login của web-app unified thay vì reload tại chỗ
    // (tránh hiển thị lại Farm Console mà không có token).
    window.location.href = "/login";
  }
}
