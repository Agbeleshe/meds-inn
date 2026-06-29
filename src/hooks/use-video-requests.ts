import { useCallback, useEffect, useState } from "react";
import { fetchVideoRequests } from "@/lib/api-client";
import type { DataSource } from "@/hooks/use-api-query";

export interface VideoCallRequestItem {
  motherId: string;
  motherName: string;
  note: string;
  requestedAt: string;
}

export function useVideoRequests(enabled = true) {
  const [items, setItems] = useState<VideoCallRequestItem[]>([]);
  const [source, setSource] = useState<DataSource>("demo");
  const [loading, setLoading] = useState(enabled);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchVideoRequests()
      .then(({ items: rows, source: apiSource }) => {
        if (cancelled) return;
        setItems(rows as VideoCallRequestItem[]);
        setSource(apiSource === "dynamodb" ? "dynamodb" : "demo");
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, tick]);

  return { items, source, loading, refetch };
}
