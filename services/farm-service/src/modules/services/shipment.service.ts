import axios, { AxiosError } from "axios";
import { env } from "../../config/env";

const shippingClient = axios.create({
  baseURL: env.SHIPPING_SERVICE_BASE_URL,
  timeout: 8000
});

const normalizePath = (path: string): string => (path.startsWith("/") ? path : `/${path}`);

export const proxyShipments = async (
  query: Record<string, unknown>,
  headers: { userId?: string; userRole?: string }
): Promise<unknown> => {
  try {
    const response = await shippingClient.get(normalizePath(env.SHIPPING_SERVICE_SHIPMENTS_PATH), {
      params: query,
      headers: {
        "X-User-Id": headers.userId,
        "X-User-Role": headers.userRole
      }
    });

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status ?? 502;
    const message =
      (typeof axiosError.response?.data === "object" && axiosError.response?.data !== null
        ? (axiosError.response.data as { message?: string }).message
        : undefined) ?? "Failed to fetch shipments";

    const wrapped = new Error(message) as Error & { status?: number };
    wrapped.status = status;
    throw wrapped;
  }
};
