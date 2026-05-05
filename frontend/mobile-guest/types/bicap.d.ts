declare module '@bicap/types' {
  export interface ApiResponse<T = any> {
    code?: number;
    message?: string;
    data: T;
  }

  export interface PageResponse<T = any> {
    data: T[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
    [key: string]: any;
  }

  export interface TimelineItem {
    id: string;
    status: string;
    description: string;
    createdAt: string;
  }

  export interface TraceResult {
    farmName: string;
    farmAddress: string;
    txHash: string;
    seasonUpdates: TimelineItem[];
  }
}
