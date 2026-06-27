import { TEAM_MEMBERS } from "@/lib/demo-data";
import type { TeamMember } from "@/types/clinical";
import { fetchTeam } from "@/lib/api-client";
import { useApiListQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/contexts/AuthContext";
import { ACTIVE_HOSPITAL_ID } from "@/lib/hospitals";

export function useTeam() {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId ?? ACTIVE_HOSPITAL_ID;

  const { data, source, loading, error, refetch } = useApiListQuery<TeamMember>({
    demoData: TEAM_MEMBERS as TeamMember[],
    fetchItems: () => fetchTeam(hospitalId),
    queryKey: hospitalId,
  });

  return { team: data, source, loading, error, refetch };
}
