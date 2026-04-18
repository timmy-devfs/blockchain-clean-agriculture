import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Search, QrCode } from "lucide-react-native";
import { guestApi } from "@/lib/api";

export default function GuestHomeScreen() {
  const router = useRouter();

  // Lấy 6 sản phẩm nổi bật
  const { data: featured, isLoading: loadingProducts } = useQuery({
    queryKey: ["featured-products"],
    queryFn: guestApi.getFeaturedProducts,
  });

  // Lấy các thông báo/khuyến mãi
  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: guestApi.getAnnouncements,
  });

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Section & Search Bar */}
        <View className="bg-green-600 pt-16 pb-10 px-6 rounded-b-[40px]">
          <Text className="text-white text-3xl font-bold">Nông sản sạch</Text>
          <Text className="text-green-100 text-lg mt-1">Minh bạch từ Blockchain</Text>

          <TouchableOpacity
            onPress={() => router.push("/search" as any)}
            className="bg-white mt-6 rounded-2xl flex-row items-center px-4 py-3 shadow-sm"
          >
            <Search size={20} color="#9ca3af" />
            <Text className="text-gray-400 ml-2">Tìm sản phẩm, nông trại...</Text>
          </TouchableOpacity>
        </View>

        {/* Announcements Carousel */}
        {announcements && announcements.length > 0 && (
          <View className="mt-6 px-4">
            <FlatList
              horizontal
              data={announcements}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                // BỌC VÀO TOUCHABLE VÀ ĐIỀU HƯỚNG TỚI TRANG BÀI VIẾT
                <TouchableOpacity
                  onPress={() => router.push(`/articles/${item.id}`)}
                  className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mr-4 w-72"
                >
                  <Text className="text-blue-800 font-bold">📢 {item.title}</Text>
                  <Text className="text-blue-600 text-sm mt-1" numberOfLines={2}>{item.content}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Featured Products List */}
        <View className="mt-8 px-4 pb-20">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">Sản phẩm tiêu biểu</Text>
          </View>

          {loadingProducts ? <ActivityIndicator color="#22c55e" /> : (
            <View className="flex-row flex-wrap justify-between">
              {featured?.map((product: any) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => router.push(`/products/${product.id}` as any)}
                  className="bg-white rounded-3xl p-3 w-[48%] mb-4 border border-gray-100 shadow-sm"
                >
                  <View className="w-full h-32 bg-gray-100 rounded-2xl mb-2 overflow-hidden">
                    <Image source={{ uri: product.imageUrl }} className="w-full h-full" />
                  </View>
                  <Text className="font-bold text-gray-800" numberOfLines={1}>{product.name}</Text>
                  <Text className="text-green-600 font-bold mt-1">{product.price.toLocaleString()}đ</Text>
                  <Text className="text-gray-400 text-[10px] mt-1">📍 {product.province}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* QuickScanButton (FAB) */}
      <TouchableOpacity
        onPress={() => router.push("/scan")}
        className="absolute bottom-6 right-6 bg-green-600 w-16 h-16 rounded-full items-center justify-center shadow-lg"
      >
        <QrCode size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}