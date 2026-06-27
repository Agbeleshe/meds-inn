import { useMemo } from "react";
import { APPOINTMENTS } from "@/lib/demo-data";
import type { Appointment } from "@/types/clinical";
import { fetchAppointments } from "@/lib/api-client";
import { useApiListQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/contexts/AuthContext";
import { ACTIVE_HOSPITAL_ID } from "@/lib/hospitals";

export function useAppointments(patientId?: string) {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId ?? ACTIVE_HOSPITAL_ID;

  const demoData = useMemo(() => {
    let items = APPOINTMENTS as Appointment[];
    if (patientId) items = items.filter((a) => a.patientId === patientId);
    return items;
  }, [patientId]);

  const { data, source, loading, error, refetch } = useApiListQuery<Appointment>({
    demoData,
    fetchItems: () => fetchAppointments({ hospitalId, patientId }),
    queryKey: `${hospitalId}-${patientId ?? "all"}`,
  });

  return { appointments: data, source, loading, error, refetch };
}
