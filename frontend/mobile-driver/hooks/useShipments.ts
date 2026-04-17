import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
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