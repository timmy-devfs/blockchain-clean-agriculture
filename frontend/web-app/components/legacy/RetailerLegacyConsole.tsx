"use client";

import dynamic from "next/dynamic";
import { ConfigProvider } from "antd";
import { MemoryRouter } from "react-router-dom";
import { useMemo } from "react";

// RetailerApp đụng tới localStorage / window khi khởi tạo, nên cần ssr:false.
const RetailerApp = dynamic(() => import("@/legacy/retailer/App"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] items-center justify-center text-sm text-gray-500">
      Đang khởi tạo Retailer Console...
    </div>
  ),
});

type RetailerLegacyConsoleProps = {
  /** Route nội bộ của legacy app (vd. `/dashboard`, `/marketplace`), không gồm prefix Next `/retailer`. */
  initialPath: string;
};

/** Map URL Next `/retailer/...` → path MemoryRouter (`/marketplace`, …). */
function memoryEntryFromProp(initialPath: string): string {
  const trimmed = initialPath.replace(/^\/retailer(?=\/|$)/, "").trim();
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withSlash === "/" || withSlash === "") {
    return "/dashboard";
  }
  return withSlash;
}

export default function RetailerLegacyConsole({ initialPath }: RetailerLegacyConsoleProps) {
  const entry = useMemo(() => memoryEntryFromProp(initialPath), [initialPath]);

  return (
    <ConfigProvider>
      <MemoryRouter initialEntries={[entry]} key={entry}>
        <RetailerApp />
      </MemoryRouter>
    </ConfigProvider>
  );
}
