"use client";

import dynamic from "next/dynamic";

const ShippingDashboardPage = dynamic(
  () => import("@/legacy/shipping/app/dashboard/page"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[60vh] items-center justify-center text-sm text-gray-500">
        Đang khởi tạo Shipping Console...
      </div>
    ),
  },
);

export default function ShippingLegacyConsole() {
  return <ShippingDashboardPage />;
}
