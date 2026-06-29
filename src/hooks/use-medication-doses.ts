import { useCallback, useEffect, useState } from "react";
import { fetchMedicationDoses } from "@/lib/api-client";
import type { MedicationDose } from "@/types/clinical";
import { USE_DEMO_FALLBACK, type DataSource, useContentAwarePageLoading } from "@/hooks/use-api-query";

export function useMedicationDoses(patientId: string | undefined, range?: { from?: string; to?: string }) {
  const [doses, setDoses] = useState<MedicationDose[]>([]);
  const [source, setSource] = useState<DataSource>("demo");
  const [loading, setLoading] = useState(Boolean(patientId));
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!patientId) {
      setDoses([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMedicationDoses({ patientId, from: range?.from, to: range?.to })
      .then(({ items, source: apiSource }) => {
        if (cancelled) return;
        setDoses(items as MedicationDose[]);
        setSource(apiSource === "dynamodb" ? "dynamodb" : "demo");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        if (USE_DEMO_FALLBACK) {
          setDoses([]);
          setSource("demo");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patientId, range?.from, range?.to, tick]);

  useContentAwarePageLoading(loading, doses.length > 0);

  return { doses, source, loading, error, refetch };
}
