import { useCallback, useEffect, useMemo, useState } from "react";
import { buildDefaultCarePlan } from "@/lib/care-plan-templates";
import {
  fetchCarePlan,
  saveCarePlan,
  patchCarePlanChecklist,
} from "@/lib/api-client";
import { USE_DEMO_FALLBACK, type DataSource, useContentAwarePageLoading } from "@/hooks/use-api-query";
import type {
  CarePlan,
  CarePlanSection,
  MotherChecklistItem,
  CareEducationItem,
  DailyChecklistAssignment,
  ChecklistAdherenceStats,
  ChecklistDaySummary,
} from "@/types/clinical";

function parseCarePlan(motherId: string, item: Record<string, unknown>, fallback: CarePlan | null): CarePlan {
  return {
    motherId,
    sections: (item.sections as CarePlanSection[]) ?? fallback?.sections ?? [],
    motherChecklist: (item.motherChecklist as MotherChecklistItem[]) ?? fallback?.motherChecklist ?? [],
    education: (item.education as CareEducationItem[]) ?? fallback?.education ?? [],
    dailyChecklist: (item.dailyChecklist as DailyChecklistAssignment | null) ?? null,
    checklistAdherence: (item.checklistAdherence as ChecklistAdherenceStats | null) ?? null,
    todayDate: item.todayDate as string | undefined,
    yesterdayDate: item.yesterdayDate as string | undefined,
    yesterdaySummary: (item.yesterdaySummary as ChecklistDaySummary | null) ?? null,
    yesterdayDate: item.yesterdayDate as string | undefined,
    yesterdaySummary: (item.yesterdaySummary as ChecklistDaySummary | null) ?? null,
    assignmentActive: item.assignmentActive as boolean | undefined,
    updatedAt: item.updatedAt as string | undefined,
  };
}

export function useCarePlan(motherId: string | undefined) {
  const demoPlan = useMemo(
    () => (motherId ? buildDefaultCarePlan(motherId) : null),
    [motherId],
  );

  const [plan, setPlan] = useState<CarePlan | null>(() =>
    USE_DEMO_FALLBACK && demoPlan ? demoPlan : null,
  );
  const [canEdit, setCanEdit] = useState(false);
  const [source, setSource] = useState<DataSource>("demo");
  const [loading, setLoading] = useState(Boolean(motherId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!motherId) {
      setLoading(false);
      setPlan(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCarePlan(motherId)
      .then(({ item, source: apiSource, canEdit: editable }) => {
        if (cancelled) return;
        setPlan(parseCarePlan(motherId, item, demoPlan));
        setCanEdit(Boolean(editable));
        setSource(apiSource === "dynamodb" ? "dynamodb" : "demo");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        if (USE_DEMO_FALLBACK && demoPlan) {
          setPlan(demoPlan);
          setCanEdit(false);
          setSource("demo");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [motherId, tick, demoPlan]);

  const persist = useCallback(
    async (payload: {
      sections?: CarePlanSection[];
      motherChecklist?: MotherChecklistItem[];
      education?: CareEducationItem[];
      dailyChecklist?: {
        items: { id?: string; text: string }[];
        durationDays: number;
        startDate?: string;
      };
    }) => {
      if (!motherId) return;
      setSaving(true);
      try {
        const { item, source: apiSource, canEdit: editable } = await saveCarePlan(motherId, payload);
        setPlan(parseCarePlan(motherId, item, demoPlan));
        setCanEdit(Boolean(editable));
        setSource(apiSource === "dynamodb" ? "dynamodb" : "demo");
      } finally {
        setSaving(false);
      }
    },
    [motherId, demoPlan],
  );

  const toggleChecklistItem = useCallback(
    async (itemId: string) => {
      if (!motherId) return;
      setSaving(true);
      try {
        const { item, source: apiSource } = await patchCarePlanChecklist(motherId, itemId);
        setPlan(parseCarePlan(motherId, item, demoPlan));
        setSource(apiSource === "dynamodb" ? "dynamodb" : "demo");
      } finally {
        setSaving(false);
      }
    },
    [motherId, demoPlan],
  );

  useContentAwarePageLoading(loading, plan !== null);

  return { plan, canEdit, source, loading, saving, error, refetch, persist, toggleChecklistItem };
}
