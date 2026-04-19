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
}
