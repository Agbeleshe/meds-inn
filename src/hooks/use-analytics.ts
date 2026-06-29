import { useCallback, useEffect, useState } from "react";
import { fetchAnalytics, type AnalyticsRange, type AnalyticsResponse } from "@/lib/api-client";
import { type DataSource, useContentAwarePageLoading } from "@/hooks/use-api-query";

const EMPTY: AnalyticsResponse = {
  range: "6m",
  metrics: {
    enrolledMothers: 0,
    activeCarePlans: 0,
    missedApptRate: 0,
    medicationAdherence: 0,
    appointmentAdherence: 0,
    checklistAdherence: null,
    careContinuityScore: 0,
    postpartumFollowUp: 0,
    messageResponseRate: 0,
    avgNurseResponseHours: null,
    highRiskCases: 0,
    activePregnancies: 0,
    postpartumMothers: 0,
  },
  adherenceTrend: [],
  riskDistribution: [],
  appointmentAttendance: [],
  nurseResponseTrend: [],
  engagementRows: [],
};

export function useAnalytics(range: AnalyticsRange = "6m") {
  const [data, setData] = useState<AnalyticsResponse>(EMPTY);
  const [source, setSource] = useState<DataSource>("dynamodb");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAnalytics(range)
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setSource(payload.source === "dynamodb" ? "dynamodb" : "demo");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [range, tick]);

  useContentAwarePageLoading(loading, !loading);

  return { data, source, loading, error, refetch };
}
