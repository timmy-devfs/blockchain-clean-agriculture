import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import type { ShipmentListItem } from "@/lib/api";

const STATUS_TEXT: Record<string, string> = {
  ASSIGNED: "Đã phân công",
  PICKED_UP: "Đã lấy hàng",
  IN_TRANSIT: "Đang giao hàng",
};

interface Props { shipment: ShipmentListItem; }

export function ActiveShipmentCard({ shipment }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/shipments/${shipment.id}`)}
      className="mb-6 rounded-3xl bg-green-500 p-5 shadow-lg shadow-green-500/30"
      activeOpacity={0.85}
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="bg-white/20 flex-row items-center justify-center px-3 py-1.5 rounded-full">
          <Text className="text-white text-xs font-bold uppercase tracking-wider">
            🚨 Đang thực hiện
          </Text>
        </View>
        <Text className="text-green-50 text-xs font-medium">
          {STATUS_TEXT[shipment.status] ?? shipment.status}
        </Text>
      </View>

      <Text className="text-white text-lg font-bold mb-1" numberOfLines={1}>
        Giao đến {shipment.retailerName}
      </Text>
      <Text className="text-green-100 text-sm mb-4" numberOfLines={1}>
        📍 {shipment.retailerAddress}
      </Text>

      <View className="flex-row items-center bg-white/20 p-3 rounded-2xl">
        <View className="w-10 h-10 bg-white rounded-full items-center justify-center mr-3">
          <Text className="text-xl">📦</Text>
        </View>
        <View className="flex-1">
          <Text className="text-green-50 text-xs">Từ {shipment.farmName}</Text>
          <Text className="text-white text-sm font-semibold mt-0.5">
            Duyệt lộ trình chi tiết
          </Text>
        </View>
        <Text className="text-white text-xl font-bold ml-2">→</Text>
      </View>
    </TouchableOpacity>
  );
}
