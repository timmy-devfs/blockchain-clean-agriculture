import { useQuery } from "@tanstack/react-query";
import { guestApi } from "@/lib/api";

// 🚀 Cập nhật Interface khớp 100% với TraceabilityService.ts của em
export interface TraceResult {
    seasonId: string;
    verified: boolean;
    farmInfo: {
        farmId: string;
        farmName: string;
        province: string;
    };
    seasonInfo: {
        seasonId: string;
        cropType: string;
        status: string;
    };
    timeline: Array<{
        status: string;
        note: string;
        timestamp: string;
    }>;
    explorerUrl: string;
}

export function useTrace(qrCode: string) {
    return useQuery<TraceResult>({
        queryKey: ["trace", qrCode],
        queryFn: () => guestApi.traceProduct(qrCode),
        enabled: !!qrCode,
        retry: 1,
    });
}