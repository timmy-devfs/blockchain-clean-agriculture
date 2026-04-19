import React from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { guestApi } from "@/lib/api";
import { ChevronLeft, QrCode, ShieldCheck } from "lucide-react-native";

export default function ProductDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const { data: product, isLoading } = useQuery({
        queryKey: ["product", id],
        queryFn: () => guestApi.getProductDetail(id as string),
    });

    if (isLoading) return <View className="flex-1 items-center justify-center"><ActivityIndicator color="#22c55e" /></View>;

    // TRÁNH CRASH APP:
    if (!product) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <Text className="text-gray-500 text-lg">Không tìm thấy thông tin sản phẩm!</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <ScrollView className="flex-1">
                {/* Product Image */}
                <Image source={{ uri: product.imageUrl }} className="w-full h-80" />
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-12 left-6 bg-white/80 p-2 rounded-full"
                >
                    <ChevronLeft size={24} color="#374151" />
                </TouchableOpacity>

                <View className="px-6 py-6">
                    <Text className="text-2xl font-bold text-gray-900">{product.name}</Text>
                    <Text className="text-green-600 text-xl font-bold mt-2">{product.price.toLocaleString()}đ / {product.unit}</Text>

                    {/* FarmCard */}
                    <View className="bg-gray-50 rounded-3xl p-4 mt-6 flex-row items-center border border-gray-100">
                        <View className="w-12 h-12 bg-green-100 rounded-2xl items-center justify-center">
                            <Text className="text-xl">🚜</Text>
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="font-bold text-gray-800">{product.farmName}</Text>
                            <Text className="text-gray-500 text-xs">Xuất xứ: {product.province}</Text>
                        </View>
                    </View>

                    {/* Blockchain Badge */}
                    <View className="mt-8 bg-blue-50 p-4 rounded-2xl border border-blue-100 flex-row items-center">
                        <ShieldCheck size={20} color="#2563eb" />
                        <Text className="ml-2 text-blue-800 font-medium">Minh bạch 100% trên Blockchain</Text>
                    </View>

                    <Text className="text-gray-600 mt-6 leading-6">{product.description}</Text>
                </View>
            </ScrollView>

            {/* CTA Button */}
            <View className="p-6 bg-white border-t border-gray-100">
                <TouchableOpacity
                    onPress={() => router.push("/(tabs)/scan")}
                    className="bg-green-600 flex-row items-center justify-center py-4 rounded-2xl shadow-lg"
                >
                    <QrCode size={20} color="white" />
                    <Text className="text-white font-bold ml-2 text-lg">Quét QR kiểm tra nguồn gốc</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}