export type Product = {
  id: string;
  title: string;
  province: string;
  category: string;
  price: number;
  certified: boolean;
  imageUrls: string[];
  farmId: string;
  seasonId: string;
  txHash?: string;
};

export type SearchFilters = {
  keyword?: string;
  province?: string;
  category?: string;
  certified?: boolean;
  priceMin?: number;
  priceMax?: number;
};

export type TraceResult = {
  seasonId: string;
  farmId: string;
  cropType: string;
  txHash?: string;
  history: Array<{
    status: string;
    at: string;
    note?: string;
  }>;
};

export type RetailOrderStatus =
  | "PENDING_PAYMENT"
  | "PLACED"
  | "CONFIRMED"
  | "SHIPPING"
  | "DELIVERED";

export type RetailOrder = {
  id: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  paymentGateway: "VNPAY" | "MOMO";
  status: RetailOrderStatus;
  createdAt: string;
  shipmentTimeline?: Array<{
    status: string;
    at: string;
    note?: string;
  }>;
};

export type NotificationItem = {
  id: string;
  title: string;
  read: boolean;
  createdAt: string;
};
