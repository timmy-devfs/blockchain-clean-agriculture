import "../global.css";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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