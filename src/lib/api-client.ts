import type { ApiListResponse } from "@/hooks/use-api-query";
import type { Role, UserProfile } from "@/types/clinical";
import { getStoredSessionToken } from "@/lib/auth-session";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function authHeaders(): Record<string, string> {
  const token = getStoredSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      ...authHeaders(),
      ...init?.headers,
    },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface SeedCounts {
  hospital: number;
  users: number;
  mothers: number;
  appointments: number;
  teamMembers: number;
  medications: number;
  messages: number;
  documents: number;
  labs: number;
}

export interface LoginParams {
  username: string;
  password: string;
  role: Role;
  hospitalId: string;
}

export interface MotherSignupParams {
  firstName: string;
  lastName: string;
  password: string;
  hospitalId: string;
  careStage: "pregnant" | "postpartum";
  gestationalWeeks?: number;
  babyWeeks?: number;
  phone?: string;
  email?: string;
  notes?: string;
}

export function loginUser(params: LoginParams) {
  return apiFetch<{ user: UserProfile; token: string }>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export function signupMother(params: MotherSignupParams) {
  return apiFetch<{ user: UserProfile; token: string }>("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export function joinHospitalWaitlist(email: string) {
  return apiFetch<{ ok: boolean; email: string; emailed: boolean; message: string }>(
    "/api/waitlist",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    },
  );
}

export function fetchMe() {
  return apiFetch<{ user: UserProfile; source?: string }>("/api/me");
}

export function fetchMothers(hospitalId?: string) {
  const query = hospitalId ? `?hospitalId=${encodeURIComponent(hospitalId)}` : "";
  return apiFetch<ApiListResponse>(`/api/mothers${query}`);
}

export function fetchMother(id: string) {
  return apiFetch<{ item: Record<string, unknown> | null; source?: string }>(
    `/api/mothers/${encodeURIComponent(id)}`,
  );
}

export interface OnboardingCompleteParams {
  age: number;
  phone: string;
  email: string;
  bloodGroup: string;
  allergies: string;
  emergencyContact: string;
  edd?: string;
  gestationalWeeks?: number;
  babyWeeks?: number;
  concerns?: string;
  careStage?: "pregnant" | "postpartum";
}

export function completeOnboarding(params: OnboardingCompleteParams) {
  return apiFetch<{ user: UserProfile; mother: Record<string, unknown> }>(
    "/api/onboarding/complete",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    },
  );
}

export function fetchAppointments(params?: { patientId?: string; hospitalId?: string }) {
  const q = new URLSearchParams();
  if (params?.patientId) q.set("patientId", params.patientId);
  if (params?.hospitalId) q.set("hospitalId", params.hospitalId);
  const query = q.toString() ? `?${q}` : "";
  return apiFetch<ApiListResponse>(`/api/appointments${query}`);
}

export function fetchMedications(params?: { patientId?: string; hospitalId?: string }) {
  const q = new URLSearchParams();
  if (params?.patientId) q.set("patientId", params.patientId);
  if (params?.hospitalId) q.set("hospitalId", params.hospitalId);
  const query = q.toString() ? `?${q}` : "";
  return apiFetch<ApiListResponse>(`/api/medications${query}`);
}

export function fetchTeam(hospitalId?: string) {
  const query = hospitalId ? `?hospitalId=${encodeURIComponent(hospitalId)}` : "";
  return apiFetch<ApiListResponse>(`/api/team${query}`);
}

export interface DashboardMetricsResponse {
  metrics: {
    totalMothers: number;
    activePregnancies: number;
    highRiskCases: number;
    todayAppointments: number;
    missedFollowUps: number;
    postpartumMothers: number;
    medicationAdherence: number;
    careContinuityScore: number;
    teamMembers: number;
  };
  needFollowUp: Record<string, unknown>[];
  upcomingAppointments: Record<string, unknown>[];
  teamSnapshot: Record<string, unknown>[];
  source?: string;
}

export function fetchDashboardMetrics(hospitalId?: string) {
  const query = hospitalId ? `?hospitalId=${encodeURIComponent(hospitalId)}` : "";
  return apiFetch<DashboardMetricsResponse>(`/api/dashboard/metrics${query}`);
}

export function fetchHealth() {
  return apiFetch<{ ok: boolean; region: string | null; table: string | null; hasAwsRole: boolean }>("/api/health");
}

export function seedDatabase() {
  return apiFetch<{ table: string; seeded: SeedCounts }>("/api/seed", { method: "POST" });
}
