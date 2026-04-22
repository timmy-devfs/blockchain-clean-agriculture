import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import type { ShipmentListItem } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: "bg-gray-100",
  PICKED_UP: "bg-yellow-100",
  IN_TRANSIT: "bg-blue-100",
  DELAYED: "bg-orange-100",
  DELIVERED: "bg-green-100",
  CANCELLED: "bg-red-100",
};

const STATUS_TEXT: Record<string, string> = {
  ASSIGNED: "Đã phân công",
  PICKED_UP: "Đã nhận hàng",
  IN_TRANSIT: "Đang giao",
  DELAYED: "Bị trì hoãn",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

interface Props { shipment: ShipmentListItem; }

export function ShipmentCard({ shipment }: Props) {
  const router = useRouter();
  const badgeBg = STATUS_COLORS[shipment.status] ?? "bg-gray-100";

  return (
    <TouchableOpacity
      onPress={() => router.push(`/shipments/${shipment.id}`)}
      className="mb-3 rounded-2xl bg-white p-4 shadow-sm border border-gray-100"
      activeOpacity={0.75}
    >
      {/* Route: farm → retailer */}
      <View className="flex-row items-center gap-2 mb-3">
        <View className="flex-1">
          <Text className="text-xs text-gray-400 mb-0.5">Nhận hàng tại</Text>
          <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
            🌾 {shipment.farmName}
          </Text>
        </View>
        <Text className="text-gray-300 text-lg">→</Text>
        <View className="flex-1">
          <Text className="text-xs text-gray-400 mb-0.5">Giao đến</Text>
          <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
            🏪 {shipment.retailerName}
          </Text>
        </View>
      </View>

      {/* Footer: status + date */}
      <View className="flex-row items-center justify-between">
        <View className={`rounded-full px-3 py-1 ${badgeBg}`}>
          <Text className="text-xs font-medium text-gray-700">
            {STATUS_TEXT[shipment.status] ?? shipment.status}
          </Text>
        </View>
        <Text className="text-xs text-gray-400">
          {new Date(shipment.scheduledDate).toLocaleDateString("vi-VN")}
        </Text>
      </View>
    </TouchableOpacity>
  );
}