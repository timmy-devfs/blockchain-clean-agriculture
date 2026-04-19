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
import type { ShipmentListItem } from "@/lib/api";

// ─── TÍCH HỢP MOCK DATA CHO MÔI TRƯỜNG TEST ─────────────────────────────
const isMockMode = true; // Chuyển thành false khi đã có Backend

const MOCK_USER = { fullName: "Tài xế Nguyễn Trung Hậu" };

// Khai báo MOCK_BASE chứa đủ các trường bắt buộc để không bị lỗi TypeScript
const MOCK_BASE = {
  orderId: "ORD-TEST", farmId: "F-1", retailerId: "R-1",
  farmAddress: "123 Đường Xanh, Đà Lạt", farmPhone: "0901234567",
  retailerAddress: "189 Cống Quỳnh, Q1", retailerPhone: "0987654321",
  driverId: "D-1", vehicleId: "V-1",
  deliveryAddress: "189 Cống Quỳnh, Quận 1, TP.HCM", 
  estimatedDelivery: new Date(Date.now() + 7200000).toISOString(), // Dự kiến giao sau 2 tiếng
  createdAt: new Date(Date.now() - 86400000).toISOString() // Ngày tạo: Hôm qua
};

const MOCK_STATS = {
  deliveredToday: 8,
  activeCount: 1,
  activeShipments: [
    { id: "SH-100", farmName: "Trang trại Hữu cơ Đà Lạt", retailerName: "Siêu thị Co.op Mart Q1", status: "IN_TRANSIT", scheduledDate: new Date().toISOString(), ...MOCK_BASE },
    { id: "SH-101", farmName: "Vườn Dưa Lưới VietGAP", retailerName: "Bách Hóa Xanh Q7", status: "ASSIGNED", scheduledDate: new Date().toISOString(), ...MOCK_BASE },
    { id: "SH-102", farmName: "Nông trường Organic Xanh", retailerName: "Lotte Mart Nam Sài Gòn", status: "ASSIGNED", scheduledDate: new Date(Date.now() + 86400000).toISOString(), ...MOCK_BASE },
    { id: "SH-103", farmName: "Farm Rau Củ Chi", retailerName: "AEON Mall Tân Phú", status: "ASSIGNED", scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString(), ...MOCK_BASE },
  ] as ShipmentListItem[]
};
// ────────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Vẫn giữ nguyên API calls để fetch ngầm
  const { data: realUser } = useQuery({
    queryKey: ["driver-me"],
    queryFn: authApi.getMe,
  });
  const { data: realStats, isLoading: isRealLoading } = useHomeStats();

  // Logic chuyển đổi (Toggle) giữa Dữ liệu Thật và Giả
  const user = isMockMode ? MOCK_USER : realUser;
  const stats = isMockMode ? MOCK_STATS : realStats;
  const isLoading = isMockMode ? false : isRealLoading;

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
    if (!isMockMode) {
      await qc.invalidateQueries({ queryKey: ["driver-home-stats"] });
      await qc.invalidateQueries({ queryKey: ["driver-me"] });
    } else {
      // Giả lập độ trễ mạng khi ở chế độ Mock
      await new Promise(resolve => setTimeout(resolve, 800)); 
    }
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
          <View className="flex-row items-center">
            <Text className="text-gray-900 text-2xl font-bold">
              {user?.fullName ?? "Tài xế"} 👋
            </Text>
            {isMockMode && <Text className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-md font-bold">TEST MODE</Text>}
          </View>
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