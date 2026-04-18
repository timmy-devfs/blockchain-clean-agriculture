import "../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from 'react';
import * as SecureStore from "expo-secure-store";
import { TOKEN_KEY, isMockMode } from "@/lib/api"; //
import { View, ActivityIndicator } from "react-native";

const queryClient = new QueryClient();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // YÊU CẦU 2: Xử lý xóa Token khi khởi chạy ở môi trường TEST
  useEffect(() => {
    const initApp = async () => {
      if (isMockMode) {
        // Nếu là môi trường Test, xóa token để bắt đăng nhập lại mỗi lần mở app
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        console.log("🛠 [TEST MODE] Đã xóa token cũ để yêu cầu đăng nhập mới");
      }
      setHasInitialized(true); // Đã khởi tạo xong môi trường
    };
    initApp();
  }, []);

  // NGƯỜI GÁC CỔNG (Auth Guard)
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