import { useCallback, useEffect, useState } from "react";
import {
  fetchCareBriefs,
  regenerateAllCareBriefs,
  regenerateCareBrief,
  patchCareBrief,
  type CareBriefListItem,
  type CareBriefRecord,
} from "@/lib/api-client";
import { type DataSource, useContentAwarePageLoading } from "@/hooks/use-api-query";

export function useCareBriefs() {
  const [items, setItems] = useState<CareBriefListItem[]>([]);
  const [source, setSource] = useState<DataSource>("dynamodb");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCareBriefs()
      .then((payload) => {
        if (cancelled) return;
        setItems(payload.items ?? []);
        setSource(payload.source === "dynamodb" ? "dynamodb" : "demo");
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
  }, [tick]);

  useContentAwarePageLoading(loading, !loading);

  const updateItemBrief = useCallback((motherId: string, brief: CareBriefRecord | null) => {
    setItems((prev) =>
      prev.map((row) => (row.motherId === motherId ? { ...row, brief } : row)),
    );
  }, []);

  const regenerateOne = useCallback(
    async (motherId: string) => {
      setBusy(true);
      try {
        const res = await regenerateCareBrief(motherId);
        updateItemBrief(motherId, res.item);
        return res.item;
      } finally {
        setBusy(false);
      }
    },
    [updateItemBrief],
  );

  const regenerateAll = useCallback(async () => {
    setBusy(true);
    try {
      const res = await regenerateAllCareBriefs();
      const byMother = new Map(res.items.map((b) => [b.motherId, b]));
      setItems((prev) =>
        prev.map((row) => ({
          ...row,
          brief: byMother.get(row.motherId) ?? row.brief,
        })),
      );
      return res.count;
    } finally {
      setBusy(false);
    }
  }, []);

  const markReviewed = useCallback(
    async (motherId: string) => {
      setBusy(true);
      try {
        const res = await patchCareBrief(motherId, { reviewed: true });
        updateItemBrief(motherId, res.item);
        return res.item;
      } finally {
        setBusy(false);
      }
    },
    [updateItemBrief],
  );

  const saveClinicianNote = useCallback(
    async (motherId: string, clinicianNote: string) => {
      setBusy(true);
      try {
        const res = await patchCareBrief(motherId, { clinicianNote });
        updateItemBrief(motherId, res.item);
        return res.item;
      } finally {
        setBusy(false);
      }
    },
    [updateItemBrief],
  );

  return {
    items,
    source,
    loading,
    error,
    busy,
    refetch,
    regenerateOne,
    regenerateAll,
    markReviewed,
    saveClinicianNote,
  };
}
