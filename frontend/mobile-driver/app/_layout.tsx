import "../global.css"; // ← Bắt buộc để NativeWind v4 inject Tailwind CSS vào app
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

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
