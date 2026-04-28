import axios from "axios";
import dayjs from "dayjs";
import { NotificationItem, Product, RetailOrder, RetailOrderStatus, SearchFilters, TraceResult } from "../types";

const retailApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_RETAIL_API_BASE_URL ?? "http://localhost/api/retail",
  timeout: 8000
});

/** Cùng key với web-farm để dùng chung JWT sau khi login qua Gateway. */
const ACCESS_TOKEN_KEY = "bicap_access_token";

const demoHeadersWhenNoJwt: Record<string, string> = {
  Authorization: "Bearer retailer-secret",
  "X-User-Id": "retailer-user-01",
  "X-User-Role": "RETAILER"
};

let autoLoginPromise: Promise<void> | null = null;

function gatewayOrigin(): string {
  const base = process.env.NEXT_PUBLIC_RETAIL_API_BASE_URL ?? "http://localhost/api/retail";
  const stripped = base.replace(/\/api\/retail\/?$/i, "");
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
      // Try seed account first, then user-created demo account.
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

const mockProducts: Product[] = Array.from({ length: 60 }).map((_, idx) => ({
  id: `prod-${idx + 1}`,
  title: idx % 2 === 0 ? `Tomato Organic Lot ${idx + 1}` : `Lettuce Premium Lot ${idx + 1}`,
  province: idx % 3 === 0 ? "Lam Dong" : idx % 3 === 1 ? "Can Tho" : "Dong Nai",
  category: idx % 2 === 0 ? "Vegetable" : "Leafy",
  price: 18000 + idx * 250,
  certified: idx % 4 !== 0,
  imageUrls: [
    `https://picsum.photos/seed/retail-${idx + 10}/480/280`,
    `https://picsum.photos/seed/retail-${idx + 11}/480/280`
  ],
  farmId: `farm-${(idx % 8) + 1}`,
  seasonId: `season-${(idx % 12) + 1}`,
  txHash: idx % 5 === 0 ? undefined : `0x${(1000000 + idx).toString(16)}abc`
}));

let mockOrders: RetailOrder[] = [
  {
    id: "ord-01",
    productName: "Tomato Organic Lot 1",
    quantity: 20,
    totalAmount: 450000,
    paymentGateway: "VNPAY",
    status: "PENDING_PAYMENT",
    createdAt: dayjs().subtract(2, "hour").toISOString()
  },
  {
    id: "ord-02",
    productName: "Lettuce Premium Lot 3",
    quantity: 12,
    totalAmount: 310000,
    paymentGateway: "MOMO",
    status: "SHIPPING",
    createdAt: dayjs().subtract(1, "day").toISOString(),
    shipmentTimeline: [
      { status: "CONFIRMED", at: dayjs().subtract(18, "hour").toISOString(), note: "Farm confirmed" },
      { status: "SHIPPING", at: dayjs().subtract(8, "hour").toISOString(), note: "In transit" }
    ]
  },
  {
    id: "ord-03",
    productName: "Tomato Organic Lot 8",
    quantity: 9,
    totalAmount: 250000,
    paymentGateway: "VNPAY",
    status: "DELIVERED",
    createdAt: dayjs().subtract(3, "day").toISOString(),
    shipmentTimeline: [
      { status: "CONFIRMED", at: dayjs().subtract(60, "hour").toISOString() },
      { status: "SHIPPING", at: dayjs().subtract(50, "hour").toISOString() },
      { status: "DELIVERED", at: dayjs().subtract(44, "hour").toISOString() }
    ]
  }
];

let mockNotifications: NotificationItem[] = [
  { id: "ntf-1", title: "Đơn ord-02 đang giao", read: false, createdAt: dayjs().subtract(30, "minute").toISOString() },
  { id: "ntf-2", title: "Có sản phẩm mới từ Lam Dong", read: false, createdAt: dayjs().subtract(1, "hour").toISOString() }
];

const applyFilters = (items: Product[], filters: SearchFilters): Product[] =>
  items.filter((item) => {
    if (filters.keyword && !item.title.toLowerCase().includes(filters.keyword.toLowerCase())) {
      return false;
    }
    if (filters.province && item.province !== filters.province) {
      return false;
    }
    if (filters.category && item.category !== filters.category) {
      return false;
    }
    if (filters.certified !== undefined && item.certified !== filters.certified) {
      return false;
    }
    if (filters.priceMin !== undefined && item.price < filters.priceMin) {
      return false;
    }
    if (filters.priceMax !== undefined && item.price > filters.priceMax) {
      return false;
    }
    return true;
  });

const PLACEHOLDER_IMAGE = "https://picsum.photos/seed/retail-placeholder/480/280";

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

    const source = Array.isArray(response.data?.items)
      ? response.data.items
      : Array.isArray(response.data?.content)
        ? response.data.content
        : Array.isArray(response.data)
          ? response.data
          : [];
    const items = source.map((row: unknown) => normalizeProduct(row));
    const hasNext = (response.data?.totalPages ?? page + 1) > page + 1;
    return { items, nextPage: hasNext ? page + 1 : null };
  } catch {
    const filtered = applyFilters(mockProducts, filters);
    const start = page * size;
    const items = filtered.slice(start, start + size);
    const nextPage = start + size < filtered.length ? page + 1 : null;
    return { items, nextPage };
  }
};

export const getProductDetail = async (id: string): Promise<Product> => {
  try {
    const response = await retailApi.get(`/marketplace/products/${id}`, { headers: getRetailAuthHeaders() });
    return normalizeProduct(response.data);
  } catch {
    return mockProducts.find((item) => item.id === id) ?? normalizeProduct({});
  }
};

export const createOrder = async (payload: {
  product: Product;
  quantity: number;
  address: string;
  gateway: "VNPAY" | "MOMO";
}): Promise<{ orderId: string; paymentUrl: string; skipPayment: boolean }> => {
  try {
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
      orderId: response.data?.order?.id ?? response.data?.id ?? `ord-${Date.now()}`,
      paymentUrl: paymentUrl || "",
      skipPayment: !paymentUrl
    };
  } catch {
    const orderId = `ord-${Date.now()}`;
    const newOrder: RetailOrder = {
      id: orderId,
      productName: payload.product.title,
      quantity: payload.quantity,
      totalAmount: payload.quantity * payload.product.price,
      paymentGateway: payload.gateway,
      status: "PENDING_PAYMENT",
      createdAt: new Date().toISOString()
    };
    mockOrders = [newOrder, ...mockOrders];
    return {
      orderId,
      paymentUrl: `${window.location.origin}/retailer/orders/callback?orderId=${orderId}&gateway=${payload.gateway}&status=success`,
      skipPayment: false
    };
  }
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
  } catch {
    mockOrders = mockOrders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            status: "PLACED"
          }
        : order
    );
  }
};

export const getOrdersByStatus = async (status: RetailOrderStatus): Promise<RetailOrder[]> => {
  try {
    const response = await retailApi.get("/orders", {
      headers: getRetailAuthHeaders(),
      params: { status }
    });
    return (response.data ?? []) as RetailOrder[];
  } catch {
    return mockOrders.filter((item) => item.status === status);
  }
};

export const getShippingTimeline = async (orderId: string): Promise<RetailOrder["shipmentTimeline"]> => {
  try {
    const response = await retailApi.get(`/orders/${orderId}/shipping`, { headers: getRetailAuthHeaders() });
    return (response.data?.timeline ?? []) as RetailOrder["shipmentTimeline"];
  } catch {
    return mockOrders.find((item) => item.id === orderId)?.shipmentTimeline ?? [];
  }
};

export const qrScanTrace = async (qrCode: string): Promise<TraceResult> => {
  try {
    const response = await retailApi.post("/qr/scan", { qrCode }, { headers: getRetailAuthHeaders() });
    return response.data as TraceResult;
  } catch {
    return {
      seasonId: "season-3",
      farmId: "farm-2",
      cropType: "Tomato",
      txHash: "0xabc123retail",
      history: [
        { status: "PREPARING", at: dayjs().subtract(40, "day").toISOString() },
        { status: "ACTIVE", at: dayjs().subtract(25, "day").toISOString() },
        { status: "HARVESTED", at: dayjs().subtract(5, "day").toISOString() }
      ]
    };
  }
};

export const confirmDelivery = async (orderId: string, recipientNote: string, files: File[]): Promise<void> => {
  const form = new FormData();
  form.append("recipientNote", recipientNote);
  files.forEach((file) => form.append("deliveryProofs", file));

  try {
    await retailApi.post(`/orders/${orderId}/confirm-delivery`, form, {
      headers: getRetailAuthHeaders()
    });
  } catch {
    mockOrders = mockOrders.map((item) =>
      item.id === orderId
        ? {
            ...item,
            status: "DELIVERED",
            shipmentTimeline: [
              ...(item.shipmentTimeline ?? []),
              {
                status: "DELIVERED",
                at: new Date().toISOString(),
                note: recipientNote
              }
            ]
          }
        : item
    );
  }
};

export const getNotifications = async (): Promise<NotificationItem[]> => {
  return mockNotifications;
};

export const getKeywordSuggestions = async (keyword: string): Promise<string[]> => {
  const trimmed = keyword.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }
  return mockProducts
    .filter((item) => item.title.toLowerCase().includes(trimmed))
    .slice(0, 8)
    .map((item) => item.title);
};
