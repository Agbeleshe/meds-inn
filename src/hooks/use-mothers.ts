import { useMemo, useCallback } from "react";
import { PATIENTS } from "@/lib/demo-data";
import type { Mother, PatientStatus, RiskLevel } from "@/types/clinical";
import { fetchMothers } from "@/lib/api-client";
import { useApiListQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/contexts/AuthContext";
import { ACTIVE_HOSPITAL_ID } from "@/lib/hospitals";

export type { Mother, RiskLevel, PatientStatus };

function withHospitalId(mothers: typeof PATIENTS): Mother[] {
  return mothers.map((m) => ({ ...m, hospitalId: ACTIVE_HOSPITAL_ID })) as Mother[];
}

export function useMothers() {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId ?? ACTIVE_HOSPITAL_ID;

  const demoData = useMemo(() => {
    const all = withHospitalId(PATIENTS);
    return all.filter((m) => m.hospitalId === hospitalId);
  }, [hospitalId]);

  const fetchItems = useCallback(
    () => fetchMothers(hospitalId),
    [hospitalId],
  );

  const { data, source, loading, error, refetch } = useApiListQuery<Mother>({
    demoData,
    fetchItems,
    queryKey: hospitalId,
  });

  return { mothers: data, source, loading, error, refetch };
}
