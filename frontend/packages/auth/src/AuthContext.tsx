"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { tokenStorage } from "@bicap/api-client";
import { decodeJWT, isTokenExpired } from "./jwtUtils";
import type { User, UserRole, AuthTokens } from "@bicap/types";
import { axiosInstance } from "@bicap/api-client";
import type { ApiResponse } from "@bicap/types";

// ─── Context shape ──────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khởi tạo: kiểm tra token cũ trong localStorage / cookie
  useEffect(() => {
    const initAuth = () => {
      const token = tokenStorage.getAccessToken();
      if (token && !isTokenExpired(token)) {
        const payload = decodeJWT(token);
        if (payload) {
          setRole(payload.role as UserRole);
          // Tạm thời set user tối thiểu từ JWT payload để ProtectedRoute không
          // false-negative khi /me chậm/lỗi tạm thời.
          setUser({
            id: (payload.sub as string) ?? "",
            email: (payload.email as string) ?? "",
            fullName: (payload.email as string) ?? "",
            phone: undefined,
            role: payload.role as UserRole,
            isActive: true,
            createdAt: new Date().toISOString(),
          } as User);
          axiosInstance
            .get<ApiResponse<User>>("/api/auth/me")
            .then(({ data }) => setUser(data.data))
            .catch(() => {
              // Giữ user tối thiểu đã set ở trên — chỉ khi token thực sự
              // bị backend revoke (401), interceptor sẽ tự xoá token.
            });
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await axiosInstance.post<ApiResponse<AuthTokens>>(
      "/api/auth/login",
      { email, password }
    );
    const { accessToken, refreshToken } = data.data;
    tokenStorage.setTokens(accessToken, refreshToken);

    const payload = decodeJWT(accessToken);
    if (payload) setRole(payload.role as UserRole);

    // /api/auth/me là best-effort: nếu fail, vẫn coi là đăng nhập thành công
    // và derive thông tin tối thiểu từ JWT payload để các ProtectedRoute hoạt động.
    try {
      const { data: userData } = await axiosInstance.get<ApiResponse<User>>(
        "/api/auth/me"
      );
      setUser(userData.data);
    } catch {
      if (payload) {
        setUser({
          id: (payload.sub as string) ?? "",
          email: (payload.email as string) ?? email,
          fullName: (payload.email as string) ?? email,
          phone: undefined,
          role: payload.role as UserRole,
          isActive: true,
          createdAt: new Date().toISOString(),
        } as User);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post("/api/auth/logout");
    } finally {
      tokenStorage.clearTokens();
      // Xóa cookie để middleware Edge Runtime không còn pass
      if (typeof document !== "undefined") {
        document.cookie = "bicap_access_token=; path=/; max-age=0; SameSite=Strict";
      }
      setUser(null);
      setRole(null);
      // Redirect về login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}