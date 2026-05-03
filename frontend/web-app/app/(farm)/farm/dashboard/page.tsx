import { ProtectedRoute } from "@bicap/auth";
import { UserRole } from "@bicap/types";
import { FarmManagerDashboard } from "@/components/farm/FarmManagerDashboard";

export default function FarmDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.FARM_MANAGER]}>
      <FarmManagerDashboard />
    </ProtectedRoute>
  );
}
