import { useCallback, useEffect, useState } from "react";
import { fetchLabs, addLabNote } from "@/lib/api-client";
import type { LabResult } from "@/types/clinical";
import { USE_DEMO_FALLBACK, type DataSource, useContentAwarePageLoading } from "@/hooks/use-api-query";

export function useLabs(patientId: string | undefined) {
  const [labs, setLabs] = useState<LabResult[]>([]);
  const [source, setSource] = useState<DataSource>("demo");
  const [loading, setLoading] = useState(Boolean(patientId));
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!patientId) {
      setLabs([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchLabs(patientId)
      .then(({ items, source: apiSource }) => {
        if (cancelled) return;
        setLabs(items as LabResult[]);
        setSource(apiSource === "dynamodb" ? "dynamodb" : "demo");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        if (USE_DEMO_FALLBACK) setLabs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patientId, tick]);

  useContentAwarePageLoading(loading, labs.length > 0);

  const createLabNote = useCallback(
    async (payload: { notes: string; test?: string; result?: string; flag?: LabResult["flag"] }) => {
      if (!patientId) throw new Error("No patient selected");
      await addLabNote({ patientId, ...payload });
      refetch();
    },
    [patientId, refetch],
  );

  return { labs, source, loading, error, refetch, createLabNote };
}
