import { useCallback, useEffect, useState } from "react";
import { DASHBOARD_METRICS, PATIENTS, APPOINTMENTS, TEAM_MEMBERS } from "@/lib/demo-data";
import { fetchDashboardMetrics } from "@/lib/api-client";
import { USE_DEMO_FALLBACK, type DataSource } from "@/hooks/use-api-query";
import { useAuth } from "@/contexts/AuthContext";
import { ACTIVE_HOSPITAL_ID } from "@/lib/hospitals";
import type { Appointment } from "@/types/clinical";

export interface DashboardMetrics {
  totalMothers: number;
  activePregnancies: number;
  highRiskCases: number;
  todayAppointments: number;
  missedFollowUps: number;
  postpartumMothers: number;
  medicationAdherence: number;
  careContinuityScore: number;
  teamMembers: number;
}

const EMPTY_METRICS: DashboardMetrics = {
  totalMothers: 0,
  activePregnancies: 0,
  highRiskCases: 0,
  todayAppointments: 0,
  missedFollowUps: 0,
  postpartumMothers: 0,
  medicationAdherence: 0,
  careContinuityScore: 0,
  teamMembers: 0,
};

const DEMO_METRICS: DashboardMetrics = {
  totalMothers: DASHBOARD_METRICS.totalMothers,
  activePregnancies: DASHBOARD_METRICS.activePregnancies,
  highRiskCases: DASHBOARD_METRICS.highRiskCases,
  todayAppointments: DASHBOARD_METRICS.todayAppointments,
  missedFollowUps: DASHBOARD_METRICS.missedFollowUps,
  postpartumMothers: DASHBOARD_METRICS.postpartumMothers,
  medicationAdherence: DASHBOARD_METRICS.medicationAdherence,
  careContinuityScore: DASHBOARD_METRICS.careContinuityScore,
  teamMembers: TEAM_MEMBERS.length,
};

const DEMO_NEED_FOLLOW_UP = PATIENTS.filter(
  (p) => p.status === "missed-followup" || p.riskLevel === "high",
).slice(0, 6);

const DEMO_UPCOMING = APPOINTMENTS.filter((a) => a.status === "scheduled").slice(
  0,
  6,
) as Appointment[];

export function useDashboardMetrics() {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId ?? ACTIVE_HOSPITAL_ID;

  const [metrics, setMetrics] = useState<DashboardMetrics>(EMPTY_METRICS);
  const [needFollowUp, setNeedFollowUp] = useState<typeof DEMO_NEED_FOLLOW_UP>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [teamSnapshot, setTeamSnapshot] = useState<typeof TEAM_MEMBERS>([]);
  const [source, setSource] = useState<DataSource>("demo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setMetrics(EMPTY_METRICS);
    setNeedFollowUp([]);
    setUpcomingAppointments([]);
    setTeamSnapshot([]);

    fetchDashboardMetrics(hospitalId)
      .then((payload) => {
        if (cancelled) return;
        setMetrics(payload.metrics);
        setNeedFollowUp(payload.needFollowUp as typeof DEMO_NEED_FOLLOW_UP);
        setUpcomingAppointments(payload.upcomingAppointments as unknown as Appointment[]);
        setTeamSnapshot(payload.teamSnapshot as typeof TEAM_MEMBERS);
        setSource(payload.source === "dynamodb" ? "dynamodb" : "demo");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        if (USE_DEMO_FALLBACK) {
          setMetrics(DEMO_METRICS);
          setNeedFollowUp(DEMO_NEED_FOLLOW_UP);
          setUpcomingAppointments(DEMO_UPCOMING);
          setTeamSnapshot(TEAM_MEMBERS.slice(0, 4));
          setSource("demo");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hospitalId, tick]);

  return {
    metrics,
    needFollowUp,
    upcomingAppointments,
    teamSnapshot,
    source,
    loading,
    error,
    refetch,
  };
}
