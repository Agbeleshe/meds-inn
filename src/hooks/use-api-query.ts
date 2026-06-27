import { useCallback, useEffect, useState } from "react";

export type DataSource = "demo" | "dynamodb";

/** When false, empty/failed API responses show empty state instead of demo data */
export const USE_DEMO_FALLBACK =
  import.meta.env.VITE_USE_DEMO_FALLBACK !== "false";

export interface ApiListResponse {
  items: Record<string, unknown>[];
  source?: string;
}

export interface UseApiListQueryResult<T> {
  data: T[];
  source: DataSource;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetches list data from `/api/*`. Starts empty (skeleton UI), then live rows.
 * Demo data is only used when the API fails or returns empty and fallback is enabled.
 */
export function useApiListQuery<T>({
  demoData,
  fetchItems,
  queryKey = "default",
}: {
  demoData: T[];
  fetchItems: () => Promise<ApiListResponse>;
  queryKey?: string | number;
}): UseApiListQueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [source, setSource] = useState<DataSource>("demo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);
    setData([]);

    fetchItems()
      .then((response) => {
        if (cancelled) return;
        const { items, source: apiSource } = response;
        if (items.length === 0) {
          if (USE_DEMO_FALLBACK) {
            setData(demoData);
            setSource("demo");
          } else {
            setData([]);
          }
          return;
        }
        setData(items as T[]);
        setSource(apiSource === "dynamodb" ? "dynamodb" : "demo");
      })
      .catch((err) => {
        if (cancelled) return;
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        if (USE_DEMO_FALLBACK) {
          setData(demoData);
          setSource("demo");
        } else {
          setData([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [queryKey, tick, demoData]);

  return { data, source, loading, error, refetch };
}
