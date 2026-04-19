import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shipmentApi } from "@/lib/api";

// Infinite scroll cho Shipments tab
export function useShipmentList(dateFilter: "TODAY" | "THIS_WEEK" | "ALL") {
  const getDateParam = () => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    if (dateFilter === "TODAY") return today;
    if (dateFilter === "THIS_WEEK") return undefined; // backend filter by week
    return undefined;
  };

  return useInfiniteQuery({
    queryKey: ["driver-shipments", dateFilter],
    queryFn: ({ pageParam = 0 }) =>
      shipmentApi.getList({
        date: getDateParam(),
        page: pageParam as number,
        size: 10,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.data.length, 0);
      return loaded < lastPage.total ? allPages.length : undefined;
    },
  });
}

// Query single shipment detail
export function useShipmentDetail(id: string) {
  return useQuery({
    queryKey: ["shipment-detail", id],
    queryFn: () => shipmentApi.getDetail(id),
    enabled: !!id,
  });
}

// Query home stats
export function useHomeStats() {
  return useQuery({
    queryKey: ["driver-home-stats"],
    queryFn: async () => {
      const [delivered, active] = await Promise.all([
        shipmentApi.getList({ status: "DELIVERED", size: 1 }),
        shipmentApi.getList({ status: "IN_TRANSIT", size: 5 }),
      ]);
      return {
        deliveredToday: delivered.total,
        activeCount: active.total,
        activeShipments: active.data,
      };
    },
  });
}

// Hook xử lý Pickup
export function usePickupShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, qrCode, photoUri }: { id: string; qrCode: string; photoUri: string }) =>
      shipmentApi.pickup(id, qrCode, photoUri),
    onSuccess: (_, variables) => {
      // Báo cho React Query biết data cũ đã lỗi thời, cần fetch lại
      queryClient.invalidateQueries({ queryKey: ["shipment-detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["driver-shipments"] });
    },
  });
}

// Hook xử lý Deliver
export function useDeliverShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, recipientName, photoUri }: { id: string; recipientName: string; photoUri: string }) =>
      shipmentApi.deliver(id, recipientName, photoUri),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shipment-detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["driver-shipments"] });
      queryClient.invalidateQueries({ queryKey: ["driver-home-stats"] }); // Cập nhật thống kê trang chủ
    },
  });
}