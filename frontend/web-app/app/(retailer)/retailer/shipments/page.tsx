import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import RetailerLegacyConsole from "@/components/legacy/RetailerLegacyConsole";

function LoadingRetailer() {
  return (
    <div className="flex h-[60vh] items-center justify-center text-sm text-gray-500">
      Đang tải Retailer Console...
    </div>
  );
}

export default function RetailerShipmentsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingRetailer />}>
        <RetailerLegacyConsole initialPath="/orders?tab=shipping" />
      </Suspense>
    </ErrorBoundary>
  );
}
