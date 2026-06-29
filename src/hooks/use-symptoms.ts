import { useCallback, useEffect, useState } from "react";
import { fetchSymptoms, logSymptom } from "@/lib/api-client";
import type { SymptomLogEntry } from "@/types/clinical";
import { USE_DEMO_FALLBACK, type DataSource, useContentAwarePageLoading } from "@/hooks/use-api-query";

export function useSymptoms(patientId: string | undefined) {
  const [symptoms, setSymptoms] = useState<SymptomLogEntry[]>([]);
  const [source, setSource] = useState<DataSource>("demo");
  const [loading, setLoading] = useState(Boolean(patientId));
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!patientId) {
      setSymptoms([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSymptoms(patientId)
      .then(({ items, source: apiSource }) => {
        if (cancelled) return;
        setSymptoms(items as SymptomLogEntry[]);
        setSource(apiSource === "dynamodb" ? "dynamodb" : "demo");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        if (USE_DEMO_FALLBACK) {
          setSymptoms([]);
          setSource("demo");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patientId, tick]);

  useContentAwarePageLoading(loading, symptoms.length > 0);

  const addSymptom = useCallback(
    async (payload: {
      symptom: string;
      severity?: "mild" | "moderate" | "severe";
      notes?: string;
      updateConcerns?: boolean;
    }) => {
      if (!patientId) throw new Error("No patient selected");
      await logSymptom({ patientId, ...payload });
      refetch();
    },
    [patientId, refetch],
  );

  return { symptoms, source, loading, error, refetch, addSymptom };
}
