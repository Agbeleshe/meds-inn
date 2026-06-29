import { useAuth } from "@/contexts/AuthContext";
import { ACTIVE_HOSPITAL_ID } from "@/lib/hospitals";

const DEFAULT_STAFF_MOTHER_ID = "MED-ELR-24018";

/** Resolve which mother record staff/mother pages should load */
export function useActiveMotherId(overrideId?: string) {
  const { user } = useAuth();
  if (overrideId) return overrideId;
  if (user?.role === "mother" && user.motherId) return user.motherId;
  return DEFAULT_STAFF_MOTHER_ID;
}

export function useActiveHospitalId() {
  const { user } = useAuth();
  return user?.hospitalId ?? ACTIVE_HOSPITAL_ID;
}
