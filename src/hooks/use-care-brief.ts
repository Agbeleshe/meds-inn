import { useCallback, useEffect, useState } from "react";
import {
  fetchCareBrief,
  regenerateCareBrief,
  patchCareBrief,
  type CareBriefRecord,
} from "@/lib/api-client";
import { useContentAwarePageLoading } from "@/hooks/use-api-query";

/** Load and manage a single patient's AI care brief (profile page, deep links). */
export function useCareBrief(motherId: string | undefined) {
  const [brief, setBrief] = useState<CareBriefRecord | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(Boolean(motherId));
  const [error, setError] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!motherId) {
      setBrief(null);
      setCanEdit(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCareBrief(motherId)
      .then((res) => {
        if (cancelled) return;
        setBrief(res.item);
        setCanEdit(res.canEdit);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [motherId, tick]);

  useContentAwarePageLoading(loading, !loading);

  const regenerate = useCallback(async () => {
    if (!motherId) return null;
    setBusy(true);
    try {
      const res = await regenerateCareBrief(motherId);
      setBrief(res.item);
      setCanEdit(res.canEdit);
      return res.item;
    } finally {
      setBusy(false);
    }
  }, [motherId]);

  const markReviewed = useCallback(async () => {
    if (!motherId) return null;
    setBusy(true);
    try {
      const res = await patchCareBrief(motherId, { reviewed: true });
      setBrief(res.item);
      return res.item;
    } finally {
      setBusy(false);
    }
  }, [motherId]);

  const saveClinicianNote = useCallback(
    async (clinicianNote: string) => {
      if (!motherId) return null;
      setBusy(true);
      try {
        const res = await patchCareBrief(motherId, { clinicianNote });
        setBrief(res.item);
        return res.item;
      } finally {
        setBusy(false);
      }
    },
    [motherId],
  );

  return {
    brief,
    canEdit,
    loading,
    error,
    busy,
    refetch,
    regenerate,
    markReviewed,
    saveClinicianNote,
  };
}
