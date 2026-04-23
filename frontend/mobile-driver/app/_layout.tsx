import "../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from 'react';
import * as SecureStore from "expo-secure-store";
import { TOKEN_KEY, isMockMode } from "@/lib/api";
import { View, ActivityIndicator } from "react-native";
import { useFirebaseMessaging } from '@/lib/useFirebaseMessaging';

import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[Background] Nhận được thông báo:', remoteMessage);
});

const queryClient = new QueryClient();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useFirebaseMessaging();

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

      // Hiển thị thông báo (Local Notification)
      await notifee.displayNotification({
        title: remoteMessage.notification?.title || "Thông báo",
        body: remoteMessage.notification?.body || "Bạn có tin nhắn mới",
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          // Hành động khi người dùng bấm vào thông báo
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
      </Stack>
    </QueryClientProvider>
  );
}