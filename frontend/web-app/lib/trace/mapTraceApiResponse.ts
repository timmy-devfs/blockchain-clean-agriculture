import type { TraceData } from "@/public-site/data/public-trace-demo";

/** Shape returned by blockchain-service / guest-service public trace (subset). */
export type TraceApiPayload = {
  seasonId?: string;
  verified?: boolean;
  farmInfo?: { farmId?: string; farmName?: string; province?: string };
  seasonInfo?: {
    cropType?: string;
    startDate?: string;
    estimatedEndDate?: string;
    description?: string;
    createdAt?: string;
    status?: string;
  };
  timeline?: Array<{
    status?: string;
    note?: string;
    imageUrls?: string[];
    updatedAt?: string;
    updatedBy?: string;
    timestamp?: string;
  }>;
  certification?: { verified?: boolean; qrHash?: string; exportedAt?: string };
  explorerUrl?: string;
};

export function mapTraceApiToTraceData(payload: unknown, qrCode: string): TraceData | null {
  if (payload == null || typeof payload !== "object") return null;
  const p = payload as TraceApiPayload;
  const farmName = p.farmInfo?.farmName?.trim() || "—";
  const province = p.farmInfo?.province?.trim() || "—";
  const productName = p.seasonInfo?.cropType?.trim() || "Sản phẩm";
  const seasonId = String(p.seasonId ?? qrCode);
  const timeline = (p.timeline ?? []).map((t) => ({
    time: String(t.timestamp ?? t.updatedAt ?? ""),
    label: String(t.status ?? "Cập nhật"),
    desc: String(t.note ?? ""),
    icon: "📋",
  }));
  const qrHash = p.certification?.qrHash?.trim();
  const explorer = typeof p.explorerUrl === "string" ? p.explorerUrl : "";
  const txFromExplorer =
    explorer.match(/0x[a-fA-F0-9]{40}/)?.[0] ?? explorer.match(/0x[a-fA-F0-9]{64}/)?.[0];
  const blockchainTxId =
    qrHash && /^0x[a-fA-F0-9]{40,128}$/i.test(qrHash)
      ? (qrHash.length > 42 ? qrHash.slice(0, 42) : qrHash)
      : txFromExplorer && txFromExplorer.length >= 42
        ? txFromExplorer.slice(0, 42)
        : `0x${Array.from({ length: 40 }, (_, i) => ((seasonId.charCodeAt(i % Math.max(seasonId.length, 1)) + i) % 16).toString(16)).join("")}`;

  return {
    id: seasonId,
    productName,
    farmName,
    farmLocation: province,
    farmOwner: "—",
    harvestDate: p.seasonInfo?.startDate ? String(p.seasonInfo.startDate).slice(0, 10) : "—",
    certNo: p.certification?.verified ? `On-chain · ${seasonId}` : "Đang cập nhật",
    blockchainTxId,
    status: String(p.seasonInfo?.status ?? "—"),
    productIntro: p.seasonInfo?.description?.trim() || undefined,
    originDetail: `Tỉnh/Thành: ${province}. Mùa vụ được xác thực qua blockchain.`,
    timeline:
      timeline.length > 0
        ? timeline
        : [
            {
              time: "—",
              label: "Không có lịch sử cập nhật",
              desc: "Chưa có mốc thời gian trên chuỗi.",
              icon: "📋",
            },
          ],
  };
}
