import { useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import messaging from "@react-native-firebase/messaging";
import { authApi, TOKEN_KEY, REFRESH_KEY, EMAIL_KEY, syncFcmTokenToBackend } from "@/lib/api";
import type { DriverUser } from "@/lib/api";

export function useAuth() {
  const router = useRouter();
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
      if (remember) await SecureStore.setItemAsync(EMAIL_KEY, email);
      setUser(result.user);
      try {
        const fcm = await messaging().getToken();
        if (fcm) await syncFcmTokenToBackend(fcm);
      } catch {
        /* FCM chua cau hinh hoac thieu google-services — bo qua */
      }
      return true;
    } catch {
      setError("Email hoặc mật khẩu không đúng");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
      setUser(null);
      
      // 2. Chuyển giao diện sang Login ngay lập tức
      router.replace("/login"); 
      
      console.log("🚪 Đã đăng xuất và chuyển về màn hình Login");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  }, [router]);

  return { user, setUser, isLoading, error, login, logout };
}