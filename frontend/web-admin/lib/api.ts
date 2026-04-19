import { axiosInstance } from "@bicap/api-client";
import type {
  ApiResponse,
  PageResponse,
  User,
  Farm,
  Notification,
} from "@bicap/types";

// ─── Auth / Accounts ──────────────────────────────────────────────────────

export const getAdminUsers = (params?: { role?: string; isActive?: boolean }) =>
  axiosInstance
    .get<ApiResponse<PageResponse<User>>>("/api/auth/admin/users", { params })
    .then((r) => r.data.data);

export const createAdminUser = (body: {
  email: string;
  fullName: string;
  password: string;
}) =>
  axiosInstance
    .post<ApiResponse<User>>("/api/auth/admin/users", body)
    .then((r) => r.data.data);

export const updateUser = (id: string, body: Partial<{ role: string; isActive: boolean }>) =>
  axiosInstance
    .put<ApiResponse<User>>(`/api/auth/admin/users/${id}`, body)
    .then((r) => r.data.data);

// ─── Farm ─────────────────────────────────────────────────────────────────

export type FarmStatus = "PENDING" | "APPROVED" | "REJECTED";

export const getAdminFarms = (status: FarmStatus) =>
  axiosInstance
    .get<ApiResponse<PageResponse<Farm>>>("/api/farm/admin/farms", { params: { status } })
    .then((r) => r.data.data);

export const getFarmDetail = (id: string) =>
  axiosInstance
    .get<ApiResponse<Farm>>(`/api/farm/admin/farms/${id}`)
    .then((r) => r.data.data);

export const approveFarm = (id: string) =>
  axiosInstance
    .put<ApiResponse<Farm>>(`/api/farm/admin/farms/${id}/approve`)
    .then((r) => r.data.data);

export const rejectFarm = (id: string, rejectReason: string) =>
  axiosInstance
    .put<ApiResponse<Farm>>(`/api/farm/admin/farms/${id}/reject`, { rejectReason })
    .then((r) => r.data.data);

// ─── Blockchain / Contracts ───────────────────────────────────────────────

export interface ContractStatus {
  farmTraceAddress: string;
  productCertAddress: string;
  lastDeployedAt: string;
}

export const getContractsStatus = () =>
  axiosInstance
    .get<ApiResponse<ContractStatus>>("/api/chain/contracts/status")
    .then((r) => r.data.data);

export interface DeployResult {
  txHash: string;
  farmTraceAddress: string;
  productCertAddress: string;
}

export const deployContracts = () =>
  axiosInstance
    .post<ApiResponse<DeployResult>>("/api/chain/contracts/deploy")
    .then((r) => r.data.data);

// ─── Reports ──────────────────────────────────────────────────────────────

export interface Report {
  id: string;
  reporterId: string;
  reporterRole: string;
  type: string;
  content: string;
  imageUrls: string[];
  status: "PENDING" | "RESOLVED";
  adminNote?: string;
  resolvedAt?: string;
  createdAt: string;
}

export const getAdminReports = (params?: {
  type?: string;
  status?: string;
  role?: string;
}) =>
  axiosInstance
    .get<ApiResponse<PageResponse<Report>>>("/api/reports/admin", { params })
    .then((r) => r.data.data);

export const resolveReport = (id: string, adminNote: string) =>
  axiosInstance
    .put<ApiResponse<Report>>(`/api/reports/${id}/resolve`, { adminNote })
    .then((r) => r.data.data);

// ─── Dashboard Stats ──────────────────────────────────────────────────────

export interface DashboardStats {
  approvedFarms: number;
  totalRetailers: number;
  ordersToday: number;
  revenueThisMonth: number;
  revenueByMonth: { month: string; revenue: number }[];
  ordersByMonth: { month: string; orders: number }[];
}

export const getDashboardStats = () =>
  axiosInstance
    .get<ApiResponse<DashboardStats>>("/api/reports/admin/dashboard")
    .then((r) => r.data.data);