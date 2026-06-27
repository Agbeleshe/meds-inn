import { useMemo } from "react";
import { PATIENTS } from "@/lib/demo-data";
import type { Mother } from "@/types/clinical";
import { fetchMother } from "@/lib/api-client";
import { useApiItemQuery } from "@/hooks/use-api-item";

export function useMother(id: string | undefined) {
  const demoData = useMemo(
    () => (PATIENTS.find((p) => p.id === id) as Mother | undefined) ?? (PATIENTS[0] as Mother),
    [id],
  );

  return useApiItemQuery<Mother>({
    id,
    demoData: id ? demoData : null,
    fetchItem: fetchMother,
    enabled: Boolean(id),
  });
}

/** Current logged-in mother's care profile */
export function useMyMotherProfile(motherId: string | undefined) {
  return useMother(motherId);
}
