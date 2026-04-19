import { QueryClient } from "@tanstack/react-query";

// React Query client config dùng chung toàn bộ FE
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,      // 30 giây trước khi refetch
      retry: 1,                   // Retry 1 lần khi lỗi
      refetchOnWindowFocus: false, // Không refetch khi focus tab
    },
    mutations: {
      retry: 0,
    },
  },
});