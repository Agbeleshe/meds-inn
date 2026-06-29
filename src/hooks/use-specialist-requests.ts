import { useCallback, useEffect, useState } from "react";
import { fetchSpecialistRequests } from "@/lib/api-client";
import { USE_DEMO_FALLBACK, type DataSource, useContentAwarePageLoading } from "@/hooks/use-api-query";
import type { SpecialistRequestType } from "@/types/clinical";

export interface SpecialistRequestItem {
  motherId: string;
  motherName: string;
  gestationalWeek: number;
  nurse: string;
  doctor: string;
  assignedNurseUserId?: string | null;
  assignedDoctorUserId?: string | null;
  specialistRequestType?: SpecialistRequestType | null;
  specialistRequestNote?: string | null;
  specialistRequestAt?: string | null;
  specialistRequestStatus?: "pending" | "resolved" | null;
  unassigned: boolean;
  pendingRequest: boolean;
}

export function useSpecialistRequests() {
  const [items, setItems] = useState<SpecialistRequestItem[]>([]);
  const [source, setSource] = useState<DataSource>("demo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSpecialistRequests()
      .then(({ items: apiItems, source: apiSource }) => {
        if (cancelled) return;
        setItems(apiItems as SpecialistRequestItem[]);
        setSource(apiSource === "dynamodb" ? "dynamodb" : "demo");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        if (USE_DEMO_FALLBACK) {
          setItems([]);
          setSource("demo");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  useContentAwarePageLoading(loading, items.length > 0);

  return { items, source, loading, error, refetch, pendingCount: items.filter((i) => i.pendingRequest).length };
}
