import { ProtectedRoute } from "@bicap/auth";
import { UserRole } from "@bicap/types";
import { FarmSeasonsView } from "@/components/farm/FarmSeasonsView";

export default function FarmSeasonsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.FARM_MANAGER]}>
      <FarmSeasonsView />
    </ProtectedRoute>
  );
}
