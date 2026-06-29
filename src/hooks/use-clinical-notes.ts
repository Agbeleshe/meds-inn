import { useCallback, useEffect, useState } from "react";
import { fetchClinicalNotes, addClinicalNote } from "@/lib/api-client";
import type { ClinicalNote } from "@/types/clinical";
import { USE_DEMO_FALLBACK, type DataSource, useContentAwarePageLoading } from "@/hooks/use-api-query";

export function useClinicalNotes(patientId: string | undefined) {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [source, setSource] = useState<DataSource>("demo");
  const [loading, setLoading] = useState(Boolean(patientId));
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!patientId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchClinicalNotes(patientId)
      .then(({ items, source: apiSource }) => {
        if (cancelled) return;
        setNotes(items as ClinicalNote[]);
        setSource(apiSource === "dynamodb" ? "dynamodb" : "demo");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        if (USE_DEMO_FALLBACK) setNotes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patientId, tick]);

  useContentAwarePageLoading(loading, notes.length > 0);

  const createNote = useCallback(
    async (note: string, category?: string) => {
      if (!patientId) throw new Error("No patient selected");
      await addClinicalNote({ patientId, note, category });
      refetch();
    },
    [patientId, refetch],
  );

  return { notes, source, loading, error, refetch, createNote };
}
