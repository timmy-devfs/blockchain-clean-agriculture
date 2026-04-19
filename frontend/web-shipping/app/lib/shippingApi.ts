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
  farmId: number;
  retailerId: number;
  driverId?: number | null;
  vehicleId?: number | null;
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  scheduledDate?: string | null; // yyyy-mm-dd
};

export type UpdateShipmentStatusRequest = {
  status: ShipmentStatus;
  note?: string | null;
  imageUrl?: string | null;
  location?: string | null;
};

const BASE = process.env.NEXT_PUBLIC_SHIPPING_API_BASE || 'http://localhost:8084';

export function makeAuthHeaders(auth: { userId: string; role: string }) {
  return {
    'X-User-Id': auth.userId,
    'X-User-Role': auth.role,
  };
}

async function apiFetch<T>(path: string, init: RequestInit = {}, auth?: { userId: string; role: string }): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (auth) {
    headers.set('X-User-Id', auth.userId);
    headers.set('X-User-Role', auth.role);
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`.trim());
  }
  return (await res.json()) as T;
}

export const ShippingApi = {
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
  async updateStatusAsDriver(id: number, body: UpdateShipmentStatusRequest, auth: { userId: string; role: string }) {
    return apiFetch<ApiResponse<Shipment>>(`/api/shipping/driver/shipments/${id}/status`, { method: 'POST', body: JSON.stringify(body) }, auth);
  },
  async pickupAsDriver(id: number, body: Partial<UpdateShipmentStatusRequest> | undefined, auth: { userId: string; role: string }) {
    return apiFetch<ApiResponse<Shipment>>(`/api/shipping/driver/shipments/${id}/pickup`, { method: 'POST', body: JSON.stringify(body ?? {}) }, auth);
  },
};

