import { useMemo } from "react";
import type { Mother } from "@/types/clinical";
import { fetchMother, patchMother } from "@/lib/api-client";
import { useApiItemQuery } from "@/hooks/use-api-item";
import { useAuth } from "@/contexts/AuthContext";
import { canEditMotherCare } from "@/lib/assignments";

export function useMother(id: string | undefined) {
  const { user } = useAuth();

  const query = useApiItemQuery<Mother>({
    id,
    demoData: null,
    fetchItem: fetchMother,
    enabled: Boolean(id),
  });

  const canEdit = Boolean(
    user &&
      query.data &&
      (user.role === "admin" ||
        (user.role === "mother" && user.motherId === id) ||
        ((user.role === "nurse" || user.role === "doctor") &&
          canEditMotherCare(user, query.data))),
  );

  async function updateProfile(payload: Record<string, unknown>) {
    if (!id) throw new Error("Missing mother id");
    const res = await patchMother(id, payload);
    query.refetch();
    return res.item as Mother;
  }

  return { ...query, canEdit: Boolean(canEdit), updateProfile };
}

/** Current logged-in mother's care profile — live API data only */
export function useMyMotherProfile(motherId: string | undefined) {
  const result = useMother(motherId);
  const { user } = useAuth();

  const canEdit = useMemo(
    () => Boolean(user?.role === "mother" && user.motherId === motherId && result.data),
    [user, motherId, result.data],
  );

  return { ...result, canEdit };
}
