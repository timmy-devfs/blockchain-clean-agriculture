"use client";

import dynamic from "next/dynamic";

// Legacy farm console dùng localStorage / window ngay trong useState init,
// vì vậy chỉ render ở client-side để tránh ReferenceError khi SSR.
const FarmApp = dynamic(() => import("@/legacy/farm/App"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] items-center justify-center text-sm text-gray-500">
      Đang khởi tạo Farm Console...
    </div>
  ),
});

export default function FarmLegacyConsole() {
  return <FarmApp />;
}
