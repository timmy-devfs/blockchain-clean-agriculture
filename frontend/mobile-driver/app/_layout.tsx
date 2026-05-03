import "../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from 'react';
import * as SecureStore from "expo-secure-store";
import { TOKEN_KEY, isMockMode } from "@/lib/api";
import { View, ActivityIndicator } from "react-native";
import { useFirebaseMessaging } from '@/lib/useFirebaseMessaging';

import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import * as Notifications from 'expo-notifications';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[Background] Nhận được thông báo:', remoteMessage);
});

const queryClient = new QueryClient();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function fcmDataStrings(data: Record<string, unknown> | undefined): Record<string, string> {
  if (!data) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v != null) out[k] = typeof v === "string" ? v : String(v);
  }
  return out;
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const handledExpoColdStart = useRef(false);

  useFirebaseMessaging();

  // Tap notification → màn shipment (background / cold start)
  useEffect(() => {
    const handleNotificationTap = (shipmentId: string) => {
      if (shipmentId) router.push(`/shipments/${shipmentId}`);
    };

    const navFromData = (data: Record<string, unknown> | undefined) => {
      const sid = data?.shipmentId;
      if (sid != null && String(sid).length > 0) {
        handleNotificationTap(String(sid));
      }
    };

    const unsubOpened = messaging().onNotificationOpenedApp((rm) => {
      console.log("[PUSH] onNotificationOpenedApp", rm?.data);
      navFromData(rm.data as Record<string, unknown> | undefined);
    });

    void messaging()
      .getInitialNotification()
      .then((rm) => {
        if (rm?.data) {
          console.log("[PUSH] getInitialNotification", rm.data);
          const sid = rm.data?.shipmentId;
          if (sid != null && String(sid).length > 0) {
            setTimeout(() => handleNotificationTap(String(sid)), 500);
          }
        }
      });

    const unsubNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const raw = detail.notification?.data;
        console.log("[PUSH] notifee press", raw);
        navFromData(raw as Record<string, unknown> | undefined);
      }
    });

    return () => {
      unsubOpened();
      unsubNotifee();
    };
  }, [router]);

  // Expo Notifications: tap / cold start (bổ sung cho luồng Expo push nếu có)
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { shipmentId?: string };
      if (data?.shipmentId) {
        router.push(`/shipments/${data.shipmentId}`);
      }
    });
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (handledExpoColdStart.current) return;
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response || handledExpoColdStart.current) return;
      const data = response.notification.request.content.data as { shipmentId?: string };
      if (data?.shipmentId) {
        handledExpoColdStart.current = true;
        router.push(`/shipments/${data.shipmentId}`);
      }
    });
  }, [router]);

  // TÍCH HỢP NOTIFEE CHO FOREGROUND
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('[Foreground] Nhận được thông báo:', remoteMessage);

      // Yêu cầu quyền (để đảm bảo an toàn)
      await notifee.requestPermission();

      // Tạo một Channel (BẮT BUỘC ĐỐI VỚI ANDROID 8.0 TRỞ LÊN)
      const channelId = await notifee.createChannel({
        id: 'high-priority',
        name: 'Thông báo quan trọng',
        //  HIGH sẽ làm thông báo rớt từ trên xuống
        importance: AndroidImportance.HIGH,
      });

      const dataPayload = fcmDataStrings(remoteMessage.data as Record<string, unknown> | undefined);

      // Hiển thị thông báo (Local Notification) — giữ data để bấm vào điều hướng
      await notifee.displayNotification({
        title: remoteMessage.notification?.title || "Thông báo",
        body: remoteMessage.notification?.body || "Bạn có tin nhắn mới",
        data: dataPayload,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
      });
    });

    return unsubscribe;
  }, []);

  // --- PHẦN CODE AUTH GUARD GIỮ NGUYÊN NHƯ CŨ ---
  useEffect(() => {
    const initApp = async () => {
      if (isMockMode) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
      setHasInitialized(true);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!hasInitialized) return;

    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const currentSegment = segments[0];

      if (!token && currentSegment !== 'login') {
        router.replace('/login');
      }
      else if (token && currentSegment === 'login') {
        router.replace('/(tabs)');
      }
      setIsReady(true);
    };

    checkAuth();
  }, [segments, hasInitialized]);

  if (!isReady || !hasInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="shipments/[id]" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}