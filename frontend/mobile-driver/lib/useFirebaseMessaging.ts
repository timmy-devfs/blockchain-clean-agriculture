import { useEffect } from "react";
import messaging from "@react-native-firebase/messaging";
import { syncFcmTokenToBackend } from "@/lib/api";

export function useFirebaseMessaging() {
  useEffect(() => {
    async function setupFirebaseMessaging() {
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
        console.warn("[FCM] getToken / dang ky backend:", error);
      }
    }

    void setupFirebaseMessaging();

    const unsubscribeTokenRefresh = messaging().onTokenRefresh((newToken) => {
      void syncFcmTokenToBackend(newToken);
    });

    return () => {
      unsubscribeTokenRefresh();
    };
  }, []);
}