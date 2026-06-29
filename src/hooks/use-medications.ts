import { useMemo } from "react";
import { MEDICATIONS } from "@/lib/demo-data";
import type { Medication } from "@/types/clinical";
import { fetchMedications } from "@/lib/api-client";
import { useApiListQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/contexts/AuthContext";
import { ACTIVE_HOSPITAL_ID } from "@/lib/hospitals";
import { filterMedicationsForRole, canEditMedication } from "@/lib/assignments";

export function useMedications(patientId?: string) {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId ?? ACTIVE_HOSPITAL_ID;

  const demoData = useMemo(() => {
    let items = MEDICATIONS.map((m) => ({
      ...(m as Medication),
      hospitalId: m.hospitalId ?? hospitalId,
      prescribedByUserId: (m as Medication).prescribedByUserId ?? "user-doctor",
    }));
    if (user) {
      items = filterMedicationsForRole(items, {
        id: user.id,
        role: user.role,
        motherId: user.motherId,
        hospitalId,
      });
    }
    if (patientId) items = items.filter((m) => m.patientId === patientId);
    return items.map((m) => ({
      ...m,
      canEdit: user ? canEditMedication(user, m) : false,
    }));
  }, [patientId, user, hospitalId]);

  const { data, source, loading, error, refetch } = useApiListQuery<Medication & { canEdit?: boolean }>({
    demoData,
    fetchItems: () => fetchMedications({ hospitalId, patientId }),
    queryKey: `${hospitalId}-${patientId ?? "all"}`,
  });

  return { medications: data, source, loading, error, refetch };
}
