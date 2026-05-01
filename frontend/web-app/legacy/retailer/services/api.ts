import axios, { isAxiosError } from "axios";
import { NotificationItem, Product, RetailOrder, RetailOrderStatus, SearchFilters, TraceResult } from "../types";

/**
 * Retailer-service qua API Gateway. Base URL = `${NEXT_PUBLIC_API_URL}/retail` (vd. http://localhost/api/retail).
 * So khớp backend: services/retailer-service (routes + swagger.config.ts). File contracts/api-specs/retailer-service.openapi.yaml
 * có thể ngắn hơn runtime — các path dưới đây là đúng với gateway `/api/retail/**`.
 *
 * Định dạng tóm tắt (path tương đối trên axios base):
 * - (cũ) base NEXT_PUBLIC_RETAIL_API_BASE_URL tách biệt → (mới) dùng NEXT_PUBLIC_API_URL + `/retail` — Lý do: một nguồn env với web-app (next.config.js), tránh lệch gateway.
 * - GET `/marketplace/products` → GET `/api/retail/marketplace/products` — Đúng với marketplace.route + gateway.
 * - GET `/marketplace/products/:id` → GET `/api/retail/marketplace/products/:id` — Chi tiết listing (swagger đầy đủ trong retailer-service, chưa copy hết vào contracts yaml).
 * - POST `/orders` → POST `/api/retail/orders` — order.route.
 * - POST `/orders/payment-callback` → POST `/api/retail/orders/payment-callback` — order.route.
 * - GET `/orders` → GET `/api/retail/orders` — order.route (query status, fromDate, toDate).
 * - GET `/orders/:orderId/shipping` → GET `/api/retail/orders/:orderId/shipping` — retailFlow.route.
 * - POST `/qr/scan` → POST `/api/retail/qr/scan` — retailFlow.route.
 * - POST `/orders/:orderId/confirm-delivery` → POST `/api/retail/orders/:orderId/confirm-delivery` — retailFlow.route (multipart).
 */

function apiGatewayPrefix(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api").replace(/\/$/, "");
}

/** Override tùy chọn: URL đầy đủ tới prefix retail (vd. cùng gateway). */
function retailServiceBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_RETAIL_API_BASE_URL?.replace(/\/$/, "").trim();
  if (explicit) return explicit;
  return `${apiGatewayPrefix()}/retail`;
}

const retailApi = axios.create({
  baseURL: retailServiceBaseUrl(),
  timeout: 8000
});

/** Dùng chung key JWT với các role routes trong web-app sau khi login qua Gateway. */
const ACCESS_TOKEN_KEY = "bicap_access_token";

const demoHeadersWhenNoJwt: Record<string, string> = {
  Authorization: "Bearer retailer-secret",
  "X-User-Id": "retailer-user-01",
  "X-User-Role": "RETAILER"
};

let autoLoginPromise: Promise<void> | null = null;

function gatewayOrigin(): string {
  const api = apiGatewayPrefix();
  const stripped = api.replace(/\/api\/?$/i, "");
  return stripped.length > 0 ? stripped : "http://localhost";
}

export function getRetailAuthHeaders(): Record<string, string> {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)?.trim();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return { ...demoHeadersWhenNoJwt };
}

export function getStoredRetailerUserIdFromJwt(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)?.trim();
  if (!token) return null;
  try {
    const b64 = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
    if (!b64) return null;
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded)) as { sub?: string };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Đăng nhập identity qua Gateway, lưu access token cho các request `/api/retail/**`. */
export async function loginRetailer(email: string, password: string): Promise<void> {
  const { data } = await axios.post<unknown>(`${gatewayOrigin()}/api/auth/login`, { email, password });
  const body = data as { data?: { accessToken?: string }; accessToken?: string };
  const token = body?.data?.accessToken ?? body?.accessToken;
  if (!token) {
    throw new Error("No access token in login response");
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

async function ensureRetailToken(): Promise<void> {
  if (typeof window === "undefined") return;
  const existing = localStorage.getItem(ACCESS_TOKEN_KEY)?.trim();
  if (existing) return;
  if (!autoLoginPromise) {
    autoLoginPromise = (async () => {
      try {
        await loginRetailer("retailer@bicap.io", "password");
        return;
      } catch {
        await loginRetailer("retail1@bicap.io", "123456");
      }
    })().finally(() => {
      autoLoginPromise = null;
    });
  }
  await autoLoginPromise;
}

retailApi.interceptors.request.use(async (config) => {
  await ensureRetailToken();
  const token = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY)?.trim() : null;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const PLACEHOLDER_IMAGE = "https://picsum.photos/seed/retail-placeholder/480/280";

function logRetailFailure(context: string, error: unknown): void {
  if (isAxiosError(error)) {
    const base = error.config?.baseURL ?? "";
    const path = error.config?.url ?? "";
    console.warn(`[retail-api] ${context}`, {
      requestUrl: base && path ? `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}` : path,
      status: error.response?.status,
      data: error.response?.data
    });
  } else {
    console.warn(`[retail-api] ${context}`, error);
  }
}

function normalizeProduct(raw: unknown): Product {
  const row = (raw ?? {}) as Record<string, unknown>;
  const images = Array.isArray(row.imageUrls)
    ? row.imageUrls.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    : [];

  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? row.productName ?? "Unknown product"),
    province: String(row.province ?? "Unknown"),
    category: String(row.category ?? "Unknown"),
    price: Number(row.price ?? row.unitPrice ?? 0),
    certified: Boolean(row.certified ?? false),
    imageUrls: images.length > 0 ? images : [PLACEHOLDER_IMAGE],
    farmId: String(row.farmId ?? ""),
    seasonId: String(row.seasonId ?? ""),
    txHash: typeof row.txHash === "string" && row.txHash.length > 0 ? row.txHash : undefined
  };
}

function normalizeRetailOrder(raw: unknown): RetailOrder {
  const row = (raw ?? {}) as Record<string, unknown>;
  const created = row.createdAt;
  const createdAt =
    typeof created === "string"
      ? created
      : created && typeof created === "object" && "toISOString" in created && typeof (created as Date).toISOString === "function"
        ? (created as Date).toISOString()
        : new Date().toISOString();

  return {
    id: String(row.id ?? ""),
    productName: String(row.productName ?? ""),
    quantity: Number(row.quantity ?? 0),
    totalAmount: Number(row.totalAmount ?? 0),
    paymentGateway: (row.paymentGateway === "MOMO" ? "MOMO" : "VNPAY") as RetailOrder["paymentGateway"],
    status: row.status as RetailOrderStatus,
    createdAt,
    shipmentTimeline: Array.isArray(row.shipmentTimeline) ? (row.shipmentTimeline as RetailOrder["shipmentTimeline"]) : undefined
  };
}

export const searchProducts = async (
  filters: SearchFilters,
  page: number,
  size = 12
): Promise<{ items: Product[]; nextPage: number | null }> => {
  try {
    const response = await retailApi.get("/marketplace/products", {
      headers: getRetailAuthHeaders(),
      params: { ...filters, page, size }
    });

    const data = response.data as Record<string, unknown> | undefined;
    const source = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.content)
        ? data.content
        : Array.isArray(response.data)
          ? response.data
          : [];
    const items = (source as unknown[]).map((row: unknown) => normalizeProduct(row));

    const total =
      typeof data?.total === "number"
        ? data.total
        : typeof data?.totalElements === "number"
          ? (data.totalElements as number)
          : undefined;
    const totalPages =
      typeof data?.totalPages === "number"
        ? (data.totalPages as number)
        : total !== undefined && size > 0
          ? Math.ceil(total / size)
          : undefined;
    const hasNext = totalPages !== undefined ? page + 1 < totalPages : items.length >= size;
    return { items, nextPage: hasNext ? page + 1 : null };
  } catch (e) {
    logRetailFailure("searchProducts", e);
    throw e;
  }
};

export const getProductDetail = async (id: string): Promise<Product> => {
  try {
    const response = await retailApi.get(`/marketplace/products/${encodeURIComponent(id)}`, { headers: getRetailAuthHeaders() });
    return normalizeProduct(response.data);
  } catch (e) {
    logRetailFailure(`getProductDetail(${id})`, e);
    throw e;
  }
};

export const createOrder = async (payload: {
  product: Product;
  quantity: number;
  address: string;
  gateway: "VNPAY" | "MOMO";
}): Promise<{ orderId: string; paymentUrl: string; skipPayment: boolean }> => {
  const response = await retailApi.post(
    "/orders",
    {
      retailerId: getStoredRetailerUserIdFromJwt() ?? "retailer-user-01",
      farmId: payload.product.farmId,
      listingId: payload.product.id,
      productName: payload.product.title,
      quantity: payload.quantity,
      totalAmount: payload.quantity * payload.product.price,
      depositAmount: payload.quantity * payload.product.price,
      deliveryAddress: payload.address,
      gateway: payload.gateway
    },
    { headers: getRetailAuthHeaders() }
  );
  const paymentUrl = String(response.data?.paymentUrl ?? "");
  return {
    orderId: response.data?.order?.id ?? response.data?.id ?? "",
    paymentUrl,
    skipPayment: !paymentUrl
  };
};

export const callbackPaymentSuccess = async (orderId: string, gateway: "VNPAY" | "MOMO"): Promise<void> => {
  try {
    await retailApi.post(
      "/orders/payment-callback",
      {
        orderId,
        paymentId: `${gateway}-${orderId}`,
        transactionId: `${gateway}-tx-${Date.now()}`,
        amount: 1
      },
      { headers: getRetailAuthHeaders() }
    );
  } catch (e) {
    logRetailFailure("callbackPaymentSuccess", e);
    throw e;
  }
};

export const getOrdersByStatus = async (status: RetailOrderStatus): Promise<RetailOrder[]> => {
  try {
    const response = await retailApi.get("/orders", {
      headers: getRetailAuthHeaders(),
      params: { status }
    });
    const raw = response.data;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((row) => normalizeRetailOrder(row));
  } catch (e) {
    logRetailFailure(`getOrdersByStatus(${status})`, e);
    throw e;
  }
};

export const getShippingTimeline = async (orderId: string): Promise<RetailOrder["shipmentTimeline"]> => {
  try {
    const response = await retailApi.get(`/orders/${encodeURIComponent(orderId)}/shipping`, { headers: getRetailAuthHeaders() });
    const data = response.data as { timeline?: unknown; events?: unknown; shipmentTimeline?: unknown } | undefined;
    const timeline = data?.timeline ?? data?.shipmentTimeline ?? data?.events;
    return (Array.isArray(timeline) ? timeline : []) as RetailOrder["shipmentTimeline"];
  } catch (e) {
    logRetailFailure(`getShippingTimeline(${orderId})`, e);
    throw e;
  }
};

export const qrScanTrace = async (qrCode: string): Promise<TraceResult> => {
  try {
    const response = await retailApi.post("/qr/scan", { qrCode }, { headers: getRetailAuthHeaders() });
    return response.data as TraceResult;
  } catch (e) {
    logRetailFailure("qrScanTrace", e);
    throw e;
  }
};

export const confirmDelivery = async (orderId: string, recipientNote: string, files: File[]): Promise<void> => {
  const form = new FormData();
  form.append("recipientNote", recipientNote);
  files.forEach((file) => form.append("deliveryProofs", file));

  try {
    await retailApi.post(`/orders/${encodeURIComponent(orderId)}/confirm-delivery`, form, {
      headers: {
        ...getRetailAuthHeaders()
      }
    });
  } catch (e) {
    logRetailFailure(`confirmDelivery(${orderId})`, e);
    throw e;
  }
};

/** Không có GET /api/retail/notifications trong retailer-service — chờ spec/backend. */
export const getNotifications = async (): Promise<NotificationItem[]> => {
  console.warn(
    "[retail-api] getNotifications: không có endpoint trong retailer-service — không dùng mock; trả []. " +
      "(contracts/api-specs/retailer-service.openapi.yaml cũng chưa định nghĩa notifications.)"
  );
  return [];
};

export const getKeywordSuggestions = async (keyword: string): Promise<string[]> => {
  const trimmed = keyword.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }
  try {
    const response = await retailApi.get("/marketplace/products", {
      headers: getRetailAuthHeaders(),
      params: { keyword: trimmed, page: 0, size: 8 }
    });
    const data = response.data as { items?: unknown[] } | undefined;
    const source = Array.isArray(data?.items) ? data.items : [];
    return source
      .map((row) => normalizeProduct(row).title)
      .filter((t, i, a) => t && a.indexOf(t) === i)
      .slice(0, 8);
  } catch (e) {
    logRetailFailure("getKeywordSuggestions", e);
    return [];
  }
};
