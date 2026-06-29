import { useCallback, useEffect, useMemo, useState } from "react";
import { applyPregnancyProgress } from "@/lib/pregnancy-stages";
import { fetchPregnancyTimeline } from "@/lib/api-client";
import { USE_DEMO_FALLBACK, type DataSource, useContentAwarePageLoading } from "@/hooks/use-api-query";
import type { PregnancyStage } from "@/types/clinical";

export function usePregnancyTimeline(motherId: string | undefined) {
  const demoStages = useMemo(
    () => applyPregnancyProgress({ gestationalWeek: 24 }),
    [],
  );

  const [stages, setStages] = useState<PregnancyStage[]>(
    USE_DEMO_FALLBACK ? demoStages : [],
  );
  const [motherName, setMotherName] = useState<string | undefined>();
  const [gestationalWeek, setGestationalWeek] = useState<number | undefined>();
  const [source, setSource] = useState<DataSource>("demo");
  const [loading, setLoading] = useState(Boolean(motherId));
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!motherId) {
      setLoading(false);
      setStages([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPregnancyTimeline(motherId)
      .then((payload) => {
        if (cancelled) return;
        setStages(payload.stages as unknown as PregnancyStage[]);
        setMotherName(payload.motherName);
        setGestationalWeek(payload.gestationalWeek);
        setSource(payload.source === "dynamodb" ? "dynamodb" : "demo");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        if (USE_DEMO_FALLBACK) {
          setStages(demoStages);
          setGestationalWeek(24);
          setSource("demo");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [motherId, tick, demoStages]);

  useContentAwarePageLoading(loading, stages.length > 0);

  return { stages, motherName, gestationalWeek, source, loading, error, refetch };
}
