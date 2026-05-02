import { Suspense } from "react";
import { ProtectedRoute } from "@bicap/auth";
import { UserRole } from "@bicap/types";
import FarmLegacyConsole from "@/components/legacy/FarmLegacyConsole";

function FarmConsoleFallback() {
  return (
    <div className="flex h-[60vh] items-center justify-center text-sm text-gray-500">
      Đang tải Farm Console...
    </div>
  );
}

export default function FarmDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.FARM_MANAGER]}>
      <Suspense fallback={<FarmConsoleFallback />}>
        <FarmLegacyConsole />
      </Suspense>
    </ProtectedRoute>
  );
}
