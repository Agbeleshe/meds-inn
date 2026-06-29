import { useCallback, useEffect, useState } from "react";
import { USE_DEMO_FALLBACK, type DataSource, useContentAwarePageLoading } from "@/hooks/use-api-query";

export interface UseApiItemQueryResult<T> {
  data: T | null;
  source: DataSource;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/** Single-record fetch with demo fallback */
export function useApiItemQuery<T>({
  id,
  demoData,
  fetchItem,
  enabled = true,
}: {
  id: string | undefined;
  demoData: T | null;
  fetchItem: (id: string) => Promise<{ item: Record<string, unknown> | null }>;
  enabled?: boolean;
}): UseApiItemQueryResult<T> {
  const [data, setData] = useState<T | null>(demoData);
  const [source, setSource] = useState<DataSource>("demo");
  const [loading, setLoading] = useState(Boolean(id && enabled));
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!id || !enabled) {
      setLoading(false);
      setData(demoData);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchItem(id)
      .then(({ item }) => {
        if (cancelled) return;
        if (!item) {
          if (!USE_DEMO_FALLBACK) setData(null);
          return;
        }
        setData(item as T);
        setSource("dynamodb");
      })
      .catch((err) => {
        if (cancelled) return;
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        if (!USE_DEMO_FALLBACK) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, enabled, fetchItem, demoData, tick]);

  useContentAwarePageLoading(loading, data !== null);

  return { data, source, loading, error, refetch };
}
