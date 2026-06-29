import { useCallback, useEffect, useState } from "react";
import { fetchCarePlanSummaries } from "@/lib/api-client";
import { USE_DEMO_FALLBACK, type DataSource, useContentAwarePageLoading } from "@/hooks/use-api-query";
import type { CarePlanSummary } from "@/types/clinical";

export function useCarePlanList(tab: "all" | "assigned" | "unassigned" = "all") {
  const [items, setItems] = useState<CarePlanSummary[]>([]);
  const [source, setSource] = useState<DataSource>("demo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCarePlanSummaries(tab)
      .then(({ items: rows, source: apiSource }) => {
        if (cancelled) return;
        setItems(rows as unknown as CarePlanSummary[]);
        setSource(apiSource === "dynamodb" ? "dynamodb" : "demo");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        if (!USE_DEMO_FALLBACK) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, tick]);

  useContentAwarePageLoading(loading, items.length > 0);

  return { items, source, loading, error, refetch };
}
