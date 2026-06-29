import { useCallback, useEffect, useState } from "react";
import type { BabyProfile } from "@/types/clinical";
import { fetchBabyProfile, saveBabyProfile } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

export function useBabyProfile(motherId?: string) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);

  const effectiveMotherId =
    user?.role === "mother" ? user.motherId : motherId;

  const load = useCallback(async () => {
    if (!effectiveMotherId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchBabyProfile(effectiveMotherId);
      setProfile(res.item ? (res.item as unknown as BabyProfile) : null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [effectiveMotherId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (payload: Partial<BabyProfile>) => {
    setSaving(true);
    try {
      const res = await saveBabyProfile(payload);
      setProfile(res.item as unknown as BabyProfile);
      return res.item;
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    loading,
    error,
    saving,
    refetch: load,
    save,
    canEdit: user?.role === "mother",
    motherId: effectiveMotherId,
  };
}
