import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; 

import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {

  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#22c55e", // Màu xanh lá khi click sẽ tự áp dụng cho Icon
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#f3f4f6",
          paddingBottom: 5 + insets.bottom,
          height: 60 + insets.bottom, 
        },
        headerStyle: { backgroundColor: "#f9fafb" },
        headerTintColor: "#111827",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shipments"
        options={{
          title: "Chuyến hàng",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Quét QR",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="qr-code-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Hồ sơ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}