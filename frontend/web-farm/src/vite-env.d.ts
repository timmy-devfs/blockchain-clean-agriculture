/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** `true` = dùng mock khi API lỗi (dev offline). Mặc định để trống = luôn dữ liệu thật. */
  readonly VITE_USE_FARM_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
