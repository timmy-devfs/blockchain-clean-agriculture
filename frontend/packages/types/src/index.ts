// ═══════════════════════════════════════════════════════
// ENUMS — khớp với backend Java/NodeJS
// ═══════════════════════════════════════════════════════

export enum UserRole {
  ADMIN = "ADMIN",
  FARM_MANAGER = "FARM_MANAGER",
  RETAILER = "RETAILER",
  SHIP_DRIVER = "SHIP_DRIVER",
  SHIPPING_MANAGER = "SHIPPING_MANAGER",
  GUEST = "GUEST",
}

export enum SeasonStatus {
  PREPARING = "PREPARING",
  ACTIVE = "ACTIVE",
  HARVESTED = "HARVESTED",
  EXPORTED = "EXPORTED",
}

export enum OrderStatus {
  PENDING_PAYMENT = "PENDING_PAYMENT",
  PLACED = "PLACED",
  CONFIRMED = "CONFIRMED",
  SHIPPING = "SHIPPING",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export enum ShipmentStatus {
  CREATED = "CREATED",
  ASSIGNED = "ASSIGNED",
  PICKED_UP = "PICKED_UP",
  IN_TRANSIT = "IN_TRANSIT",
  DELAYED = "DELAYED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  RETURNED = "RETURNED",
}

export enum VehicleType {
  MOTORBIKE = "MOTORBIKE",
  VAN = "VAN",
  TRUCK = "TRUCK",
  REFRIGERATED = "REFRIGERATED",
}

// ═══════════════════════════════════════════════════════
// GENERIC API WRAPPERS
// ═══════════════════════════════════════════════════════

/** Wrapper chuẩn cho mọi API response từ backend */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** Wrapper cho danh sách có phân trang */
export interface PageResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

// ═══════════════════════════════════════════════════════
// USER & AUTH
// ═══════════════════════════════════════════════════════

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ═══════════════════════════════════════════════════════
// FARM
// ═══════════════════════════════════════════════════════

export interface Farm {
  id: string;
  ownerId: string;
  farmName: string;
  province: string;
  address: string;
  totalArea: number; // hectare
  /** Enum từ backend — derive từ isApproved + rejectReason nếu backend chưa trả */
  status: "PENDING" | "APPROVED" | "REJECTED";
  isApproved: boolean;
  rejectReason?: string;
  createdAt: string;
}

export interface BusinessLicense {
  id: string;
  farmId: string;
  licenseNumber: string;
  fileUrl: string;
  issuedDate: string;
  expiryDate: string;
}

// ═══════════════════════════════════════════════════════
// FARMING SEASON
// ═══════════════════════════════════════════════════════

export interface Season {
  id: string;
  farmId: string;
  cropType: string;
  quantity: number;
  unit: string;
  startDate: string;
  endDate?: string;
  status: SeasonStatus;
  blockchainTxHash?: string; // null khi đang ghi blockchain
  qrCodeUrl?: string;
  createdAt: string;
}

export interface SeasonUpdate {
  id: string;
  seasonId: string;
  description: string;
  imageUrls: string[];
  createdAt: string;
}

// ═══════════════════════════════════════════════════════
// ORDER
// ═══════════════════════════════════════════════════════

export interface Order {
  id: string;
  listingId: string;
  retailerId: string;
  farmId: string;
  quantity: number;
  totalPrice: number;
  depositAmount: number;
  status: OrderStatus;
  deliveryAddress: string;
  statusHistory: OrderStatusHistory[];
  createdAt: string;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  note?: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════
// SHIPMENT
// ═══════════════════════════════════════════════════════

export interface Shipment {
  id: string;
  orderId: string;
  driverId: string;
  vehicleId: string;
  status: ShipmentStatus;
  pickupImageUrls: string[];
  deliveryImageUrls: string[];
  statusHistory: ShipmentStatusHistory[];
  estimatedDelivery: string;
  createdAt: string;
}

export interface ShipmentStatusHistory {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  note?: string;
  location?: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  fullName: string;
  phone: string;
  licenseNumber: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  type: VehicleType;
  capacity: number;
  isActive: boolean;
}

// ═══════════════════════════════════════════════════════
// NOTIFICATION
// ═══════════════════════════════════════════════════════

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  data?: Record<string, string>;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════
// IOT
// ═══════════════════════════════════════════════════════

export interface IoTReading {
  id: string;
  farmId: string;
  sensorId: string;
  type: "TEMPERATURE" | "HUMIDITY" | "PH";
  value: number;
  unit: string;
  isAlert: boolean;
  recordedAt: string;
}

// ═══════════════════════════════════════════════════════
// PAYMENT
// ═══════════════════════════════════════════════════════

export interface Payment {
  id: string;
  payerId: string;
  orderId: string;
  amount: number;
  type: "DEPOSIT" | "PACKAGE";
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  gateway: "VNPAY" | "MOMO";
  transactionId?: string;
  createdAt: string;
}