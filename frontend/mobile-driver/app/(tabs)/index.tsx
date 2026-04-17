import React, { useState } from "react";
import {
  View, Text, ScrollView, RefreshControl,
  FlatList, TouchableOpacity,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { StatCard } from "@/components/StatCard";
import { ActiveShipmentCard } from "@/components/ActiveShipmentCard";
import { ShipmentCard } from "@/components/ShipmentCard";
import { useHomeStats } from "@/hooks/useShipments";
import { authApi } from "@/lib/api";

export default function HomeScreen() {
  const router     = useRouter();
  const qc         = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["driver-me"],
    queryFn: authApi.getMe,
  });

  const { data: stats, isLoading } = useHomeStats();

  // Lọc ra chuyến hàng đang active
  const activeShipment = stats?.activeShipments?.find((s) =>
    ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(s.status)
  );

  // 5 chuyến sắp tới (chưa bắt đầu, scheduled)
  const upcoming = stats?.activeShipments
    ?.filter((s) => s.status === "ASSIGNED")
    .slice(0, 5) ?? [];

  const onRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ["driver-home-stats"] });
    await qc.invalidateQueries({ queryKey: ["driver-me"] });
    setRefreshing(false);
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#22c55e"
          colors={["#22c55e"]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View className="px-4 pt-6 pb-10">
        {/* Greeting */}
        <View className="mb-5">
          <Text className="text-gray-500 text-sm">Xin chào,</Text>
          <Text className="text-gray-900 text-2xl font-bold">
            {user?.fullName ?? "Tài xế"} 👋
          </Text>
        </View>

        {/* StatCards */}
        <View className="flex-row mb-5">
          <StatCard
            title="Giao hôm nay"
            value={isLoading ? "..." : (stats?.deliveredToday ?? 0)}
            icon="✅"
            color="bg-green-50"
          />
          <StatCard
            title="Đang giao"
            value={isLoading ? "..." : (stats?.activeCount ?? 0)}
            icon="🚚"
            color="bg-blue-50"
          />
        </View>

        {/* Active shipment */}
        {activeShipment && (
          <ActiveShipmentCard shipment={activeShipment} />
        )}

        {/* Upcoming */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-semibold text-gray-800">
            Chuyến hàng sắp tới
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/shipments")}>
            <Text className="text-green-600 text-sm font-medium">Xem tất cả →</Text>
          </TouchableOpacity>
        </View>

        {upcoming.length === 0 ? (
          <View className="rounded-2xl bg-white p-6 items-center border border-gray-100">
            <Text className="text-gray-400 text-sm">Không có chuyến hàng sắp tới</Text>
          </View>
        ) : (
          upcoming.map((s) => <ShipmentCard key={s.id} shipment={s} />)
        )}
      </View>
    </ScrollView>
  );
}