import { useCallback, useEffect, useRef, useState } from "react";
import { usePageLoadingRegistration } from "@/contexts/PageLoadingContext";

export type DataSource = "demo" | "dynamodb" | "session";

/** When false, empty/failed API responses show empty state instead of demo data */
export const USE_DEMO_FALLBACK =
  import.meta.env.VITE_USE_DEMO_FALLBACK === "true";

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

/** Full-screen overlay only when loading and nothing visible yet (not on background sync). */
export function useContentAwarePageLoading(loading: boolean, hasContent: boolean) {
  usePageLoadingRegistration(loading && !hasContent);
}

/**
 * Fetches list data from `/api/*`. Keeps prior rows visible during background refresh.
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
  const [data, setData] = useState<T[]>(() =>
    USE_DEMO_FALLBACK ? demoData : [],
  );
  const [source, setSource] = useState<DataSource>("demo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);
  const fetchRef = useRef(fetchItems);
  fetchRef.current = fetchItems;
  const requestIdRef = useRef(0);
  const hasDataRef = useRef(data.length > 0);
  hasDataRef.current = data.length > 0;

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (USE_DEMO_FALLBACK) {
      setData(demoData);
      setSource("demo");
    }
  }, [demoData]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    let cancelled = false;

    if (!hasDataRef.current) setLoading(true);
    setError(null);

    fetchRef
      .current()
      .then((response) => {
        if (cancelled || requestId !== requestIdRef.current) return;
        const { items, source: apiSource } = response;
        if (items.length === 0) {
          if (USE_DEMO_FALLBACK) {
            setData(demoData);
            setSource("demo");
          } else {
            setData([]);
            setSource(apiSource === "dynamodb" ? "dynamodb" : "demo");
          }
          return;
        }
        setData(items as T[]);
        setSource(apiSource === "dynamodb" ? "dynamodb" : "demo");
      })
      .catch((err) => {
        if (cancelled || requestId !== requestIdRef.current) return;
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        if (USE_DEMO_FALLBACK) {
          setData(demoData);
          setSource("demo");
        }
      })
      .finally(() => {
        if (cancelled || requestId !== requestIdRef.current) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [queryKey, tick, demoData]);

  useContentAwarePageLoading(loading, data.length > 0);

  return { data, source, loading, error, refetch };
}
