import { useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import messaging from "@react-native-firebase/messaging";
import { TOKEN_KEY, USER_ID_KEY, syncFcmTokenToBackend } from "@/lib/api";

/**
 * Đăng ký FCM token với backend chỉ khi đã có JWT + user id (sau login).
 * Refresh token cũng chỉ sync khi session hợp lệ.
 */
export function useFirebaseMessaging() {
  useEffect(() => {
    async function registerWhenLoggedIn() {
      const jwt = await SecureStore.getItemAsync(TOKEN_KEY);
      const userId = await SecureStore.getItemAsync(USER_ID_KEY);
      if (!jwt?.trim() || !userId?.trim()) {
        return;
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        return;
      }

      try {
        const token = await messaging().getToken();
        if (token) {
          await syncFcmTokenToBackend(token);
        }
      } catch (error) {
        console.warn("[FCM] getToken / đăng ký backend:", error);
      }
    }

    void registerWhenLoggedIn();

    const unsubscribeTokenRefresh = messaging().onTokenRefresh((newToken) => {
      void (async () => {
        const jwt = await SecureStore.getItemAsync(TOKEN_KEY);
        const userId = await SecureStore.getItemAsync(USER_ID_KEY);
        if (!jwt?.trim() || !userId?.trim()) return;
        try {
          await syncFcmTokenToBackend(newToken);
        } catch (e) {
          console.warn("[FCM] onTokenRefresh sync:", e);
        }
      })();
    });

    return () => {
      unsubscribeTokenRefresh();
    };
  }, []);
}
