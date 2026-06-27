import { useMemo } from "react";
import { MEDICATIONS } from "@/lib/demo-data";
import type { Medication } from "@/types/clinical";
import { fetchMedications } from "@/lib/api-client";
import { useApiListQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/contexts/AuthContext";
import { ACTIVE_HOSPITAL_ID } from "@/lib/hospitals";

export function useMedications(patientId?: string) {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId ?? ACTIVE_HOSPITAL_ID;

  const demoData = useMemo(() => {
    let items = MEDICATIONS as Medication[];
    if (patientId) items = items.filter((m) => m.patientId === patientId);
    return items;
  }, [patientId]);

  const { data, source, loading, error, refetch } = useApiListQuery<Medication>({
    demoData,
    fetchItems: () => fetchMedications({ hospitalId, patientId }),
    queryKey: `${hospitalId}-${patientId ?? "all"}`,
  });

  return { medications: data, source, loading, error, refetch };
}
