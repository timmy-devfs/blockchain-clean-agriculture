import React from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { authApi, TOKEN_KEY, REFRESH_KEY } from "@/lib/api";

export default function ProfileScreen() {
  const router = useRouter();
  const qc     = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["driver-me"],
    queryFn: authApi.getMe,
  });

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc muốn đăng xuất?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_KEY);
            qc.clear();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-400">Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="px-4 pt-8 pb-10">
        {/* Avatar + name */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center mb-3">
            <Text className="text-5xl">👤</Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">{user?.fullName}</Text>
          <Text className="text-sm text-gray-500 mt-0.5">{user?.email}</Text>
          <View className="mt-2 bg-green-100 rounded-full px-3 py-1">
            <Text className="text-green-700 text-xs font-medium">Tài xế giao hàng</Text>
          </View>
        </View>

        {/* Info card */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <Text className="text-sm font-semibold text-gray-800 mb-3">Thông tin cá nhân</Text>
          {[
            ["📧 Email",       user?.email  ?? "—"],
            ["📱 Số điện thoại", user?.phone ?? "—"],
          ].map(([label, value]) => (
            <View key={label} className="flex-row justify-between py-2 border-b border-gray-50">
              <Text className="text-sm text-gray-500">{label}</Text>
              <Text className="text-sm font-medium text-gray-800">{value}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <TouchableOpacity
            onPress={() => Alert.alert("Tính năng", "Đổi mật khẩu sẽ sớm có")}
            className="flex-row items-center justify-between px-5 py-4 border-b border-gray-50"
          >
            <Text className="text-sm font-medium text-gray-800">🔑 Đổi mật khẩu</Text>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Alert.alert("Phiên bản", "BICAP Driver v1.0.0")}
            className="flex-row items-center justify-between px-5 py-4"
          >
            <Text className="text-sm font-medium text-gray-800">ℹ️ Phiên bản ứng dụng</Text>
            <Text className="text-gray-400 text-sm">1.0.0</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-50 rounded-2xl py-4 items-center border border-red-100"
          activeOpacity={0.8}
        >
          <Text className="text-red-600 font-semibold text-base">🚪 Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}