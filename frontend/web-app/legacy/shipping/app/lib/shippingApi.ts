export type ApiResponse<T> = { code: number; message: string; data: T };

export type ShipmentStatus = 'CREATED' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELAYED' | 'DELIVERED' | 'CANCELLED';

export type Shipment = {
  id: number;
  orderId: number;
  farmId: number;
  retailerId: number;
  driverId: number | null;
  vehicleId: number | null;
  status: ShipmentStatus;
  pickupAddress: string | null;
  deliveryAddress: string | null;
  scheduledDate: string | null; // yyyy-mm-dd
  /** Tên hiển thị — shipping-service tra farm-service */
  farmName?: string | null;
  retailerName?: string | null;
};

export type ShipmentHistoryRow = {
  id: number;
  shipmentId: number;
  status: ShipmentStatus;
  changedAt: string; // ISO
  changedBy: string | null;
  note: string | null;
  imageUrls: string | null;
};

export type CreateShipmentRequest = {
  orderId: number;
  farmId?: number | null;
  retailerId?: number | null;
  driverId?: number | null;
  vehicleId?: number | null;
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  scheduledDate?: string | null; // yyyy-mm-dd
  farmExternalId?: string | null;
  retailerExternalId?: string | null;
  farmDisplayName?: string | null;
  retailerDisplayName?: string | null;
};

/** Khớp shipping-service PendingConfirmedOrderResponse */
export type PendingConfirmedOrder = {
  id: string;
  orderId: number;
  deliveryAddress: string | null;
  shipmentId: number | null;
  farmId: number | null;
  retailerId: number | null;
  farmExternalId?: string | null;
  retailerExternalId?: string | null;
};

export type DriverApiRow = {
  id: number;
  fullName: string;
  phone: string | null;
  licenseNo: string | null;
  licenseClass: string | null;
  isActive: boolean | null;
  email?: string | null;
  isLinked?: boolean;
  /** UUID identity (JWT sub) — dùng cho FCM / gắn tài khoản tài xế */
  identityUserId?: string | null;
};

export type VehicleApiRow = {
  id: number;
  licensePlate: string;
  type: string;
  /** Dung tích (kg/m³) — optional trong một số response */
  capacity?: number | null;
  isActive: boolean | null;
};

export type UpdateShipmentStatusRequest = {
  status: ShipmentStatus;
  note?: string | null;
  imageUrl?: string | null;
  location?: string | null;
};

/**
 * Origin gateway (không có `/api` cuối) — cùng quy tắc với farm `gateway.ts` / `api-client` axios.
 * Mọi path gọi đầy đủ `/api/shipping/...` → ví dụ `http://localhost/api/shipping/shipments`.
 */
function gatewayOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api").replace(/\/+$/, "");
  if (raw.endsWith("/api")) {
    return raw.slice(0, -4);
  }
  return raw;
}

const GATEWAY_ORIGIN = gatewayOrigin();

export function makeAuthHeaders(auth: { userId: string; role: string }) {
  return {
    "X-User-Id": auth.userId,
    "X-User-Role": auth.role,
  };
}

async function apiFetch<T>(path: string, init: RequestInit = {}, auth?: { userId: string; role: string }): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("bicap_access_token")?.trim();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  if (auth) {
    headers.set("X-User-Id", auth.userId);
    headers.set("X-User-Role", auth.role);
  }

  // Browser phải đi same-origin qua Nginx (/api/...) để tránh CORS preflight
  // với shipping-service/gateway khi deploy local Docker.
  const base = typeof window !== "undefined" ? "" : GATEWAY_ORIGIN;
  const res = await fetch(`${base}${path}`, { ...init, headers, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`.trim());
  }
  return (await res.json()) as T;
}

async function apiFetchShippingProxy<T>(
  proxyPath: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("bicap_access_token")?.trim();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const res = await fetch(`/internal/shipping-proxy${proxyPath}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`.trim());
  }
  return (await res.json()) as T;
}

export const ShippingApi = {
  async health(auth?: { userId: string; role: string }) {
    return apiFetch<ApiResponse<{ status: string }>>(`/api/shipping/health`, {}, auth);
  },
  async listConfirmedOrders(auth: { userId: string; role: string }) {
    return apiFetch<ApiResponse<PendingConfirmedOrder[]>>(`/api/shipping/orders/confirmed`, {}, auth);
  },
  async listDrivers(auth: { userId: string; role: string }) {
    const [shippersRes, driversRes] = await Promise.allSettled([
      apiFetch<ApiResponse<Array<{ id: string; email: string; fullName: string; phone?: string | null }>>>(
        `/api/auth/shippers`,
        {},
        auth,
      ),
      apiFetch<ApiResponse<DriverApiRow[]>>(`/api/shipping/drivers`, {}, auth),
    ]);

    const shipperUsers =
      shippersRes.status === "fulfilled" && Array.isArray(shippersRes.value?.data)
        ? shippersRes.value.data
        : [];
    const shippingDrivers =
      driversRes.status === "fulfilled" && Array.isArray(driversRes.value?.data)
        ? driversRes.value.data
        : [];

    const byIdentity = new Map<string, DriverApiRow>();
    for (const d of shippingDrivers) {
      if (d.identityUserId) byIdentity.set(String(d.identityUserId), d);
    }

    if (shipperUsers.length === 0) {
      return { code: 200, message: "OK", data: shippingDrivers } satisfies ApiResponse<DriverApiRow[]>;
    }

    const merged: DriverApiRow[] = shipperUsers.map((u) => {
      const linked = byIdentity.get(String(u.id));
      return {
        id: linked?.id ?? 0,
        fullName: u.fullName || linked?.fullName || "",
        phone: linked?.phone ?? (u.phone ?? null),
        licenseNo: linked?.licenseNo ?? null,
        licenseClass: linked?.licenseClass ?? null,
        isActive: linked?.isActive ?? true,
        email: u.email,
        identityUserId: String(u.id),
        isLinked: Boolean(linked),
      };
    });
    return { code: 200, message: "OK", data: merged } satisfies ApiResponse<DriverApiRow[]>;
  },
  async createDriver(
    body: { fullName: string; phone?: string; licenseNumber?: string; identityUserId?: string | null },
    auth: { userId: string; role: string },
  ) {
    return apiFetch<ApiResponse<DriverApiRow>>(`/api/shipping/drivers`, { method: "POST", body: JSON.stringify(body) }, auth);
  },
  /** POST /api/notify/notifications/send — gửi FCM tới user (cần quyền SHIPPING_MANAGER / ADMIN trên gateway). */
  async sendDriverPush(
    body: { userId: string; title: string; body: string; data?: Record<string, string> },
    auth: { userId: string; role: string },
  ) {
    return apiFetch<ApiResponse<null>>(`/api/notify/notifications/send`, { method: "POST", body: JSON.stringify(body) }, auth);
  },
  async listVehicles(auth: { userId: string; role: string }) {
    return apiFetch<ApiResponse<VehicleApiRow[]>>(`/api/shipping/vehicles`, {}, auth);
  },
  async createVehicle(
    body: { licensePlate: string; type: string; capacity?: number },
    auth: { userId: string; role: string },
  ) {
    return apiFetch<ApiResponse<VehicleApiRow>>(`/api/shipping/vehicles`, { method: "POST", body: JSON.stringify(body) }, auth);
  },
  async listShipments(auth: { userId: string; role: string }) {
    return apiFetch<ApiResponse<Shipment[]>>(`/api/shipping/shipments`, {}, auth);
  },
  async getShipment(id: number, auth: { userId: string; role: string }) {
    return apiFetch<ApiResponse<Shipment>>(`/api/shipping/shipments/${id}`, {}, auth);
  },
  async history(id: number, auth: { userId: string; role: string }) {
    return apiFetch<ApiResponse<ShipmentHistoryRow[]>>(`/api/shipping/shipments/${id}/history`, {}, auth);
  },
  async createShipment(body: CreateShipmentRequest, auth: { userId: string; role: string }) {
    return apiFetch<ApiResponse<Shipment>>(`/api/shipping/shipments`, { method: 'POST', body: JSON.stringify(body) }, auth);
  },
  async deleteShipment(id: number, auth: { userId: string; role: string }) {
    return apiFetch<ApiResponse<null>>(`/api/shipping/shipments/${id}`, { method: 'DELETE' }, auth);
  },
  /** POST /api/shipping/shipments/{id}/status — quản lý cập nhật trạng thái (không cần role tài xế). */
  async updateShipmentStatus(id: number, body: UpdateShipmentStatusRequest, auth: { userId: string; role: string }) {
    return apiFetch<ApiResponse<Shipment>>(`/api/shipping/shipments/${id}/status`, { method: 'POST', body: JSON.stringify(body) }, auth);
  },
  async updateStatusAsDriver(id: number, body: UpdateShipmentStatusRequest, auth: { userId: string; role: string }) {
    void auth;
    return apiFetchShippingProxy<ApiResponse<Shipment>>(`/driver/shipments/${id}/status`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  async pickupAsDriver(id: number, body: Partial<UpdateShipmentStatusRequest> | undefined, auth: { userId: string; role: string }) {
    void auth;
    return apiFetchShippingProxy<ApiResponse<Shipment>>(`/driver/shipments/${id}/pickup`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    });
  },
};

