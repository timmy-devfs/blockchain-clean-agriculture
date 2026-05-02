import { getPublicApiBaseUrl } from "@/lib/publicApiUrl";
import { getDemoTraceData, type TraceData } from "@/public-site/data/public-trace-demo";
import { mapTraceApiToTraceData } from "@/lib/trace/mapTraceApiResponse";

export type TraceLoadSource = "api" | "demo";

export async function loadTraceForQr(
  qrCode: string,
): Promise<{ data: TraceData; source: TraceLoadSource } | null> {
  const trimmed = qrCode.trim();
  if (!trimmed) return null;

  const base = getPublicApiBaseUrl();
  try {
    const res = await fetch(`${base}/public/trace/${encodeURIComponent(trimmed)}`, {
      cache: "no-store",
    });
    const json = (await res.json()) as { code?: number; data?: unknown };
    if (res.ok && json.code === 200 && json.data != null) {
      const mapped = mapTraceApiToTraceData(json.data, trimmed);
      if (mapped) return { data: mapped, source: "api" };
    }
  } catch {
    /* fallback demo */
  }

  const demo = getDemoTraceData(trimmed);
  if (demo) return { data: demo, source: "demo" };
  return null;
}
