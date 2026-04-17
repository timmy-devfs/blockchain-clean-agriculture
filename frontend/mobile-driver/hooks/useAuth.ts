import { useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { authApi, TOKEN_KEY, REFRESH_KEY, EMAIL_KEY } from "@/lib/api";
import type { DriverUser } from "@/lib/api";

export function useAuth() {
  const [user, setUser]       = useState<DriverUser | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Đăng nhập bằng email + password
  const login = useCallback(async (
    email: string,
    password: string,
    remember: boolean
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authApi.login(email, password);
      await SecureStore.setItemAsync(TOKEN_KEY, result.accessToken);
      await SecureStore.setItemAsync(REFRESH_KEY, result.refreshToken);
      if (remember) await SecureStore.setItemAsync(EMAIL_KEY, email);
      setUser(result.user);
      return true;
    } catch {
      setError("Email hoặc mật khẩu không đúng");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Biometric login — đọc token từ SecureStore và verify
  const loginWithBiometric = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Kiểm tra thiết bị hỗ trợ
      const hasBiometric = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled   = await LocalAuthentication.isEnrolledAsync();
      if (!hasBiometric || !isEnrolled) {
        setError("Thiết bị không hỗ trợ sinh trắc học");
        return false;
      }

      // Xác thực sinh trắc học
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Xác thực để đăng nhập BICAP Driver",
        fallbackLabel: "Dùng mật khẩu",
      });

      if (!result.success) return false;

      // Lấy token đã lưu trước đó
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        setError("Chưa có phiên đăng nhập. Hãy đăng nhập bằng mật khẩu lần đầu.");
        return false;
      }

      // Verify token vẫn còn hiệu lực bằng cách gọi /me
      const me = await authApi.getMe();
      setUser(me);
      return true;
    } catch {
      setError("Xác thực sinh trắc học thất bại");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Đăng xuất
  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    setUser(null);
  }, []);

  return { user, setUser, isLoading, error, login, loginWithBiometric, logout };
}