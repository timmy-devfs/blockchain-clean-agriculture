"use client";

import dynamic from "next/dynamic";
import { ConfigProvider } from "antd";
import { MemoryRouter } from "react-router-dom";

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
  initialPath: string;
};

export default function RetailerLegacyConsole({ initialPath }: RetailerLegacyConsoleProps) {
  return (
    <ConfigProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <RetailerApp />
      </MemoryRouter>
    </ConfigProvider>
  );
}
