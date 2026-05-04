import { useState, useCallback } from "react";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as LocalAuthentication from "expo-local-authentication";
import messaging from "@react-native-firebase/messaging";
import { authApi, TOKEN_KEY, REFRESH_KEY, EMAIL_KEY, USER_ID_KEY, syncFcmTokenToBackend } from "@/lib/api";
import type { DriverUser } from "@/lib/api";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser]       = useState<DriverUser | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authApi.login(email, password);
      await SecureStore.setItemAsync(TOKEN_KEY, result.accessToken);
      await SecureStore.setItemAsync(REFRESH_KEY, result.refreshToken);
      await SecureStore.setItemAsync(USER_ID_KEY, result.user.id);
      if (remember) await SecureStore.setItemAsync(EMAIL_KEY, email);
      setUser(result.user);
      // Tránh hiển thị cache của tài khoản cũ khi vừa đổi user đăng nhập.
      queryClient.clear();
      try {
        const fcm = await messaging().getToken();
        if (fcm) {
          console.log("[FCM] Login success, token:", fcm);
          await syncFcmTokenToBackend(fcm);
          console.log("[PUSH] Token registered for user:", result.user.id);
        } else {
          console.warn("[FCM] Login success but token is empty");
        }
      } catch (fcmError) {
        console.warn("[FCM] Login success but getToken failed:", fcmError);
      }
      return true;
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        if (!e.response) {
          setError("Không kết nối được server. Kiểm tra EXPO_PUBLIC_API_URL và mạng.");
        } else if (e.response.status === 401 || e.response.status === 403) {
          setError("Email hoặc mật khẩu không đúng");
        } else {
          setError(`Đăng nhập thất bại (HTTP ${e.response.status})`);
        }
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Đăng nhập thất bại");
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
      await SecureStore.deleteItemAsync(USER_ID_KEY);
      setUser(null);
      queryClient.clear();
      
      // 2. Chuyển giao diện sang Login ngay lập tức
      router.replace("/login"); 
      
      console.log("🚪 Đã đăng xuất và chuyển về màn hình Login");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  }, [router, queryClient]);

  return { user, setUser, isLoading, error, login, logout };
}