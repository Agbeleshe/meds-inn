import { useCallback, useMemo } from "react";
import { DEFAULT_TIMELINE_EVENTS } from "@/lib/timeline-events";
import { fetchTimeline } from "@/lib/api-client";
import { useApiListQuery } from "@/hooks/use-api-query";
import type { TimelineEvent } from "@/types/clinical";

export function useMotherTimeline(motherId: string | undefined) {
  const demoData = useMemo(
    () =>
      (motherId
        ? DEFAULT_TIMELINE_EVENTS.map((e) => ({ ...e, patientId: motherId }))
        : []) as TimelineEvent[],
    [motherId],
  );

  const fetchItems = useCallback(
    () => (motherId ? fetchTimeline(motherId) : Promise.resolve({ items: [] })),
    [motherId],
  );

  const { data, source, loading, error, refetch } = useApiListQuery<TimelineEvent>({
    demoData,
    fetchItems,
    queryKey: motherId ?? "none",
  });

  return { events: data, source, loading, error, refetch };
}
