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

  // Khởi tạo: kiểm tra token cũ trong localStorage
  useEffect(() => {
    const initAuth = () => {
      const token = tokenStorage.getAccessToken();
      if (token && !isTokenExpired(token)) {
        const payload = decodeJWT(token);
        if (payload) {
          setRole(payload.role as UserRole);
          // Fetch user profile để lấy thông tin đầy đủ
          axiosInstance
            .get<ApiResponse<User>>("/api/auth/me")
            .then(({ data }) => setUser(data.data))
            .catch(() => {
              tokenStorage.clearTokens();
              setUser(null);
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

    const { data: userData } = await axiosInstance.get<ApiResponse<User>>(
      "/api/auth/me"
    );
    setUser(userData.data);
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post("/api/auth/logout");
    } finally {
      tokenStorage.clearTokens();
      setUser(null);
      setRole(null);
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