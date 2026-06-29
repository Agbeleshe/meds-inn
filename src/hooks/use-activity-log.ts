import { useCallback, useEffect, useState } from "react";
import { fetchActivityLog } from "@/lib/api-client";
import type { ActivityLogEntry } from "@/types/clinical";
import { USE_DEMO_FALLBACK, type DataSource } from "@/hooks/use-api-query";

export function useActivityLog(limit = 50) {
  const [items, setItems] = useState<ActivityLogEntry[]>([]);
  const [source, setSource] = useState<DataSource>("demo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (limit <= 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchActivityLog(limit)
      .then(({ items: rows, source: apiSource }) => {
        if (cancelled) return;
        setItems(rows as ActivityLogEntry[]);
        setSource(apiSource === "dynamodb" ? "dynamodb" : "demo");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        if (USE_DEMO_FALLBACK) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [limit, tick]);

  return { items, source, loading, error, refetch };
}
