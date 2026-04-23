import "../global.css";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFirebaseMessaging } from "@/lib/useFirebaseMessaging";
import messaging from '@react-native-firebase/messaging';

import notifee, { AndroidImportance } from '@notifee/react-native';

// Bắt buộc khai báo ở global scope (ngoài component) để xử lý thông báo khi App đang chạy ngầm hoặc đã tắt
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[Background] Nhận được thông báo:', remoteMessage);
});

// Khởi tạo QueryClient để quản lý cache dữ liệu nông sản 
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // Dữ liệu nông sản sạch 5 phút mới làm mới một lần
    },
  },
});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  // Kích hoạt Firebase Messaging
  useFirebaseMessaging();

  //TÍCH HỢP NOTIFEE CHO FOREGROUND (Hiển thị Banner từ trên xuống)
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('🔔 [Foreground] Nhận được thông báo:', remoteMessage);

      // Yêu cầu quyền (để đảm bảo an toàn)
      await notifee.requestPermission();

      // Tạo một Channel (BẮT BUỘC ĐỐI VỚI ANDROID 8.0 TRỞ LÊN)
      const channelId = await notifee.createChannel({
        id: 'high-priority',
        name: 'Thông báo quan trọng',
        // HIGH sẽ ép Android thả thông báo từ trên xuống
        importance: AndroidImportance.HIGH,
      });

      // Hiển thị thông báo (Local Notification)
      await notifee.displayNotification({
        title: remoteMessage.notification?.title || "Thông báo",
        body: remoteMessage.notification?.body || "Bạn có một tin nhắn mới",
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

  useEffect(() => {
    setIsReady(true);
  }, []);

  // Màn hình loading khi app đang khởi tạo các dịch vụ nền
  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />

      {/* Cấu hình các màn hình trong ứng dụng  */}
      <Stack screenOptions={{ headerShown: false }}>
        {/* Tab chính: Home, Search, Scan, News */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Màn hình chi tiết sản phẩm  */}
        <Stack.Screen
          name="products/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

        {/* Màn hình Truy xuất nguồn gốc Blockchain  */}
        <Stack.Screen
          name="trace/[qrCode]"
          options={{
            headerShown: true,
            title: "Truy xuất nguồn gốc",
            headerTitleStyle: { fontWeight: 'bold' },
            headerTintColor: '#111827',
            headerBackTitle: "Quay lại"
          }}
        />

        {/* Màn hình chi tiết bài viết  */}
        <Stack.Screen
          name="articles/[id]"
          options={{
            headerShown: true,
            title: "Kiến thức nông nghiệp",
            headerBackTitle: "Quay lại"
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}