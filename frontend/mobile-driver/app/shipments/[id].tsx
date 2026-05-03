import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  Linking, ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useShipmentDetail } from "@/hooks/useShipments";
import { StatusTimeline } from "@/components/StatusTimeline";

const STATUS_ACTION: Record<string, { label: string; actionType: string } | null> = {
  ASSIGNED: { label: "Bắt đầu nhận hàng", actionType: "pickup" },
  PICKED_UP: { label: "Đang vận chuyển", actionType: "scan_only" },
  IN_TRANSIT: { label: "Xác nhận giao hàng", actionType: "deliver" },
  DELIVERED: null,
  CANCELLED: null,
};

export default function ShipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: shipment, isLoading } = useShipmentDetail(id);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (!shipment) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-400">Không tìm thấy chuyến hàng</Text>
      </View>
    );
  }

  const action = STATUS_ACTION[shipment.status];
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shipment.deliveryAddress)}`;

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="px-4 pt-4 pb-10 space-y-4">

        {/* Farm Info */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <Text className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">
            📦 Nhận hàng tại Farm
          </Text>
          <Text className="text-base font-bold text-gray-900 mb-1">{shipment.farmName}</Text>
          <Text className="text-sm text-gray-500 mb-3">📍 {shipment.farmAddress}</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${shipment.farmPhone}`)}
            className="flex-row items-center gap-2 bg-green-50 rounded-xl px-4 py-2.5"
          >
            <Text className="text-green-600 text-sm font-medium">
              📞 Gọi Farm: {shipment.farmPhone}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Retailer Info */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <Text className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">
            🏪 Giao hàng đến Retailer
          </Text>
          <Text className="text-base font-bold text-gray-900 mb-1">{shipment.retailerName}</Text>
          <Text className="text-sm text-gray-500 mb-3">📍 {shipment.retailerAddress}</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${shipment.retailerPhone}`)}
            className="flex-row items-center gap-2 bg-blue-50 rounded-xl px-4 py-2.5 mb-2"
          >
            <Text className="text-blue-600 text-sm font-medium">
              📞 Gọi Retailer: {shipment.retailerPhone}
            </Text>
          </TouchableOpacity>

          {/* Navigate Button */}
          <TouchableOpacity
            onPress={() => Linking.openURL(mapsUrl)}
            className="flex-row items-center justify-center gap-2 bg-green-500 rounded-xl px-4 py-3"
          >
            <Text className="text-white text-sm font-semibold">🗺 Điều hướng Google Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Địa chỉ giao hàng */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <Text className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
            📍 Địa chỉ giao hàng
          </Text>
          <Text className="text-sm text-gray-800 leading-6">{shipment.deliveryAddress}</Text>
        </View>

        {/* Status Timeline */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <Text className="text-sm font-semibold text-gray-800 mb-4">📋 Lịch sử trạng thái</Text>
          <StatusTimeline history={shipment.statusHistory} />
        </View>

        {/* Action Button — conditional by status */}
        {action && (
          <TouchableOpacity
            onPress={() => router.push({
              pathname: "/(tabs)/scan",
              params: { shipmentId: id, actionType: action.actionType }
            })}
            className="bg-green-500 rounded-2xl py-4 items-center shadow-sm"
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-base">{action.label}</Text>
            <Text className="text-green-100 text-xs mt-0.5">Chuyển sang màn hình Quét QR</Text>
          </TouchableOpacity>
        )}

        {/* Delivery info */}
        <View className="bg-gray-100 rounded-2xl p-4">
          <Text className="text-xs text-gray-500">
            Dự kiến giao: {new Date(shipment.estimatedDelivery).toLocaleString("vi-VN")}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">
            Mã chuyến: #{shipment.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}