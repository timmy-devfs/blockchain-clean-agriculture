import React, { useState, useMemo } from "react";
import {
  View, Text, SectionList, TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useShipmentList } from "@/hooks/useShipments";
import { ShipmentCard } from "@/components/ShipmentCard";
import type { ShipmentListItem } from "@/lib/api";

type Filter = "TODAY" | "THIS_WEEK" | "ALL";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "Hôm nay",    value: "TODAY"     },
  { label: "Tuần này",   value: "THIS_WEEK" },
  { label: "Tất cả",     value: "ALL"       },
];

// ─── TÍCH HỢP MOCK DATA CHO MÔI TRƯỜNG TEST ─────────────────────────────
const isMockMode = true; // Chuyển thành false khi đã có Backend

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

const MOCK_ALL_SHIPMENTS: ShipmentListItem[] = [
  // Hôm nay
  { id: "SH-100", farmName: "Trang trại Hữu cơ Đà Lạt", retailerName: "Siêu thị Co.op Mart Q1", status: "IN_TRANSIT", scheduledDate: new Date().toISOString(), ...MOCK_BASE },
  { id: "SH-101", farmName: "Vườn Dưa Lưới VietGAP", retailerName: "Bách Hóa Xanh Q7", status: "ASSIGNED", scheduledDate: new Date().toISOString(), ...MOCK_BASE },
  // Ngày mai
  { id: "SH-102", farmName: "Nông trường Organic Xanh", retailerName: "Lotte Mart NSG", status: "ASSIGNED", scheduledDate: new Date(Date.now() + 86400000).toISOString(), ...MOCK_BASE },
  // Hôm qua (Đã giao xong)
  { id: "SH-099", farmName: "Farm Rau Sạch Củ Chi", retailerName: "AEON Mall Tân Phú", status: "DELIVERED", scheduledDate: new Date(Date.now() - 86400000).toISOString(), ...MOCK_BASE },
];
// ────────────────────────────────────────────────────────────────────────

// Group shipments by scheduledDate → SectionList format
function groupByDate(shipments: ShipmentListItem[]) {
  const map = new Map<string, ShipmentListItem[]>();
  shipments.forEach((s) => {
    const dateKey = new Date(s.scheduledDate).toLocaleDateString("vi-VN");
    if (!map.has(dateKey)) map.set(dateKey, []);
    map.get(dateKey)!.push(s);
  });
  return Array.from(map.entries()).map(([date, data]) => ({ date, data }));
}

export default function ShipmentsScreen() {
  const [filter, setFilter] = useState<Filter>("TODAY");

  // Vẫn gọi API ngầm
  const { data, isLoading: isRealLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useShipmentList(filter);

  // Flatten tất cả pages hoặc dùng Mock Data
  const allShipments = useMemo(() => {
    if (isMockMode) {
      const todayStr = new Date().toLocaleDateString("vi-VN");
      if (filter === "TODAY") {
        return MOCK_ALL_SHIPMENTS.filter(s => new Date(s.scheduledDate).toLocaleDateString("vi-VN") === todayStr);
      }
      // Demo giả lập bộ lọc: Trả về toàn bộ cho THIS_WEEK và ALL
      return MOCK_ALL_SHIPMENTS; 
    }
    return data?.pages.flatMap((p) => p.data) ?? [];
  }, [data, filter]);

  const sections = useMemo(() => groupByDate(allShipments), [allShipments]);
  const isLoading = isMockMode ? false : isRealLoading;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Filter chips */}
      <View className="flex-row gap-2 px-4 pt-4 pb-2 bg-white border-b border-gray-100">
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            onPress={() => setFilter(f.value)}
            className={`rounded-full px-4 py-2 ${
              filter === f.value
                ? "bg-green-500"
                : "bg-gray-100"
            }`}
          >
            <Text className={`text-sm font-medium ${
              filter === f.value ? "text-white" : "text-gray-600"
            }`}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : sections.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400 text-sm">Không có chuyến hàng</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-4">
              <ShipmentCard shipment={item} />
            </View>
          )}
          renderSectionHeader={({ section }) => (
            <View className="px-4 py-2 bg-gray-50">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                📅 {section.date}
              </Text>
            </View>
          )}
          onEndReached={() => {
            if (!isMockMode && hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage && !isMockMode ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="#22c55e" />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
        />
      )}
    </View>
  );
}