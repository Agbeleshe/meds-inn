import { useCallback, useEffect, useState } from "react";
import { fetchDashboardMetrics } from "@/lib/api-client";
import { type DataSource, useContentAwarePageLoading } from "@/hooks/use-api-query";
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
  appointmentAdherence: number;
  careContinuityScore: number;
  teamMembers: number;
}

export interface AssignedPatientRow {
  id: string;
  name: string;
  initials: string;
  gestationalWeek: number;
  riskLevel: string;
  status: string;
  lastCheckIn: string;
  adherence: number;
  medicationAdherence: number;
  appointmentAdherence: number | null;
  nextAppointment: string;
}

export interface DashboardAlert {
  patient: string;
  patientId?: string;
  note: string;
  severity: "high" | "medium" | "low";
  time: string;
}

const EMPTY_METRICS: DashboardMetrics = {
  totalMothers: 0,
  activePregnancies: 0,
  highRiskCases: 0,
  todayAppointments: 0,
  missedFollowUps: 0,
  postpartumMothers: 0,
  medicationAdherence: 0,
  appointmentAdherence: 0,
  careContinuityScore: 0,
  teamMembers: 0,
};

export function useDashboardMetrics() {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId ?? ACTIVE_HOSPITAL_ID;

  const [metrics, setMetrics] = useState<DashboardMetrics>(EMPTY_METRICS);
  const [scope, setScope] = useState<"hospital" | "assigned">("hospital");
  const [assignedPatients, setAssignedPatients] = useState<AssignedPatientRow[]>([]);
  const [needFollowUp, setNeedFollowUp] = useState<AssignedPatientRow[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [teamSnapshot, setTeamSnapshot] = useState<Record<string, unknown>[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<DashboardAlert[]>([]);
  const [source, setSource] = useState<DataSource>("dynamodb");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchDashboardMetrics(hospitalId)
      .then((payload) => {
        if (cancelled) return;
        setScope(payload.scope === "assigned" ? "assigned" : "hospital");
        setMetrics({
          ...payload.metrics,
          appointmentAdherence: payload.metrics.appointmentAdherence ?? 0,
        });
        setAssignedPatients((payload.assignedPatients ?? []) as AssignedPatientRow[]);
        setNeedFollowUp(payload.needFollowUp as AssignedPatientRow[]);
        setUpcomingAppointments(payload.upcomingAppointments as unknown as Appointment[]);
        setTeamSnapshot(payload.teamSnapshot);
        setRecentAlerts(payload.recentAlerts ?? []);
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
  }, [hospitalId, tick]);

  useContentAwarePageLoading(loading, !loading);

  return {
    metrics,
    scope,
    assignedPatients,
    needFollowUp,
    upcomingAppointments,
    teamSnapshot,
    recentAlerts,
    source,
    loading,
    error,
    refetch,
  };
}
