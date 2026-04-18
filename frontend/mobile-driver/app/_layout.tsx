import "../global.css"; // ← Bắt buộc để NativeWind v4 inject Tailwind CSS vào app
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncOfflineQueue } from '@/lib/offlineSync';

// Tạo QueryClient một lần duy nhất ở root — tránh re-create khi re-render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 phút
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    // Đăng ký Listener: Hàm này sẽ tự động chạy MỖI KHI trạng thái mạng thay đổi
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log("🌐 Mạng đã kết nối lại! Bắt đầu kiểm tra hàng đợi...");
        syncOfflineQueue(); // Gọi hàm đồng bộ
      } else {
        console.log("📡 Mất mạng 3G/Wi-Fi.");
      }
    });

    return () => unsubscribe(); // Cleanup khi tắt app
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Tab navigator — màn hình chính của ứng dụng */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Chi tiết chuyến hàng */}
        <Stack.Screen
          name="shipments/[id]"
          options={{
            headerShown: true,
            title: "Chi tiết chuyến hàng",
            headerStyle: { backgroundColor: "#f9fafb" },
            headerTintColor: "#111827",
            headerBackTitle: "Quay lại",
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
