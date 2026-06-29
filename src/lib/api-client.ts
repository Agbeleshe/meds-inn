import type { ApiListResponse } from "@/hooks/use-api-query";
import type { Role, UserProfile } from "@/types/clinical";
import { getStoredSessionToken } from "@/lib/auth-session";
import { mergeMotherProfile, writeMotherOverride } from "@/lib/mother-profile-cache";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function authHeaders(): Record<string, string> {
  const token = getStoredSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function extractApiError(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const err = (body as { error?: unknown }).error;
    if (typeof err === "string" && err.trim()) return err;
    if (err && typeof err === "object" && "message" in err) {
      const msg = (err as { message?: unknown }).message;
      if (typeof msg === "string" && msg.trim()) return msg;
    }
  }
  return `API error ${status}`;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { headers: initHeaders, ...rest } = init ?? {};
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...authHeaders(),
      ...(initHeaders as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(extractApiError(body, res.status));
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
  carePlans?: number;
  timelineEvents?: number;
}

export interface LoginParams {
  email: string;
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

export async function fetchMother(id: string) {
  const res = await apiFetch<{ item: Record<string, unknown> | null; source?: string }>(
    `/api/mothers/${encodeURIComponent(id)}`,
  );
  if (res.item) {
    res.item = mergeMotherProfile(id, res.item);
  }
  return res;
}

export function patchMother(id: string, payload: Record<string, unknown>) {
  return apiFetch<{ item: Record<string, unknown>; source?: string }>(
    `/api/mothers/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  ).then((res) => {
    if (res.item) writeMotherOverride(id, res.item);
    return res;
  });
}

export function escalateCase(
  motherId: string,
  payload: {
    note: string;
    severity: "urgent" | "serious" | "mild";
    targets?: ("doctor" | "nurse" | "admin")[];
  },
) {
  return apiFetch<{ item: Record<string, unknown>; source?: string }>(
    `/api/mothers/${encodeURIComponent(motherId)}/escalate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  ).then((res) => {
    if (res.item) writeMotherOverride(motherId, res.item);
    return res;
  });
}

export function fetchEscalations() {
  return apiFetch<{ items: Record<string, unknown>[]; source?: string }>("/api/escalations");
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

export function fetchAppointments(params?: { patientId?: string }) {
  const q = new URLSearchParams();
  if (params?.patientId) q.set("patientId", params.patientId);
  const query = q.toString() ? `?${q}` : "";
  return apiFetch<ApiListResponse>(`/api/appointments${query}`);
}

export interface AppointmentPayload {
  patientId: string;
  date: string;
  time: string;
  type?: string;
  reason?: string;
  duration?: number;
  location?: string;
  mode?: string;
  clinician?: string;
}

export function createAppointment(payload: AppointmentPayload) {
  return apiFetch<{ item: Record<string, unknown>; source?: string }>("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export interface RescheduleAppointmentPayload {
  date?: string;
  time?: string;
  action?: "mark_attended" | "confirm_attendance";
  attendanceNote?: string;
}

export function rescheduleAppointment(id: string, payload: RescheduleAppointmentPayload) {
  return apiFetch<{ item: Record<string, unknown>; source?: string }>(
    `/api/appointments/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

export function markAppointmentAttended(id: string) {
  return rescheduleAppointment(id, { action: "mark_attended" });
}

export function confirmAppointmentAttendance(id: string, attendanceNote?: string) {
  return rescheduleAppointment(id, { action: "confirm_attendance", attendanceNote });
}

export function fetchDocuments(params?: { patientId?: string }) {
  const q = new URLSearchParams();
  if (params?.patientId) q.set("patientId", params.patientId);
  const query = q.toString() ? `?${q}` : "";
  return apiFetch<ApiListResponse>(`/api/documents${query}`).catch((err) => {
    console.error("[documents] fetchDocuments API error:", err);
    throw err;
  });
}

export function uploadDocument(payload: {
  patientId: string;
  name: string;
  category: string;
  mimeType: string;
  contentBase64: string;
}) {
  return apiFetch<{ item: Record<string, unknown>; source?: string }>("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.error("[documents] uploadDocument API error:", err);
    throw err;
  });
}

export function downloadDocument(id: string) {
  return apiFetch<{
    item: Record<string, unknown>;
    contentBase64: string;
    mimeType: string;
    source?: string;
  }>(`/api/documents/${encodeURIComponent(id)}`);
}

export function deleteDocument(id: string) {
  return apiFetch<{ ok: boolean; source?: string }>(
    `/api/documents/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export function fetchBabyProfile(motherId?: string) {
  const query = motherId ? `?motherId=${encodeURIComponent(motherId)}` : "";
  return apiFetch<{ item: Record<string, unknown> | null; source?: string }>(`/api/baby${query}`);
}

export function saveBabyProfile(payload: Record<string, unknown>) {
  return apiFetch<{ item: Record<string, unknown>; source?: string }>("/api/baby", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function fetchBabySymptoms(motherId?: string) {
  const query = motherId ? `?motherId=${encodeURIComponent(motherId)}` : "";
  return apiFetch<ApiListResponse>(`/api/baby-symptoms${query}`);
}

export function submitBabySymptom(payload: { symptom: string; severity?: string; notes?: string; motherId?: string }) {
  const query = payload.motherId ? `?motherId=${encodeURIComponent(payload.motherId)}` : "";
  return apiFetch<{ item: Record<string, unknown>; source?: string }>(`/api/baby-symptoms${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function fetchBabyMedications(motherId?: string) {
  const query = motherId ? `?motherId=${encodeURIComponent(motherId)}` : "";
  return apiFetch<ApiListResponse>(`/api/baby-medications${query}`);
}

export function createBabyMedication(payload: Record<string, unknown> & { motherId?: string }) {
  const query = payload.motherId ? `?motherId=${encodeURIComponent(payload.motherId)}` : "";
  return apiFetch<{ item: Record<string, unknown>; source?: string }>(`/api/baby-medications${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function fetchBabyChecklist(motherId?: string) {
  const query = motherId ? `?motherId=${encodeURIComponent(motherId)}` : "";
  return apiFetch<{ item: Record<string, unknown>; source?: string }>(`/api/baby-checklist${query}`);
}

export function toggleBabyChecklistItem(itemId: string, motherId?: string) {
  const query = motherId ? `?motherId=${encodeURIComponent(motherId)}` : "";
  return apiFetch<{ item: Record<string, unknown>; source?: string }>(`/api/baby-checklist${query}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId }),
  });
}

export function fetchMedications(params?: { patientId?: string; hospitalId?: string }) {
  const q = new URLSearchParams();
  if (params?.patientId) q.set("patientId", params.patientId);
  if (params?.hospitalId) q.set("hospitalId", params.hospitalId);
  const query = q.toString() ? `?${q}` : "";
  return apiFetch<{ items: Record<string, unknown>[]; source?: string }>(`/api/medications${query}`);
}

export interface MedicationPayload {
  id?: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  instructions: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export function createMedication(payload: MedicationPayload) {
  return apiFetch<{ item: Record<string, unknown>; source?: string }>("/api/medications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateMedication(payload: MedicationPayload & { id: string }) {
  return apiFetch<{ item: Record<string, unknown>; source?: string }>("/api/medications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function fetchMedicationDoses(params: {
  patientId: string;
  from?: string;
  to?: string;
}) {
  const q = new URLSearchParams({ patientId: params.patientId });
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  return apiFetch<{ items: Record<string, unknown>[]; source?: string }>(
    `/api/medications/doses?${q}`,
  );
}

export function recordMedicationDose(payload: {
  doseId: string;
  medicationId: string;
  patientId: string;
  date: string;
  scheduledTime: string;
  status: "taken" | "skipped";
}) {
  return apiFetch<{ item: Record<string, unknown> }>("/api/medications/doses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function submitSpecialistRequest(
  motherId: string,
  payload: { type: "request" | "change" | "report"; note?: string },
) {
  const res = await apiFetch<{ item: Record<string, unknown> }>(
    `/api/mothers/${encodeURIComponent(motherId)}/specialist-request`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (res.item) writeMotherOverride(motherId, res.item);
  return res;
}

export function fetchSpecialistRequests() {
  return apiFetch<{ items: Record<string, unknown>[]; source?: string }>("/api/specialist-requests");
}

export function fetchVideoRequests() {
  return apiFetch<ApiListResponse>("/api/video-requests");
}

export function submitVideoCallRequest(note?: string) {
  return apiFetch<{ item: Record<string, unknown>; source?: string }>("/api/video-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  }).then((res) => {
    if (res.item && res.item.id) writeMotherOverride(String(res.item.id), res.item);
    return res;
  });
}

export function resolveVideoCallRequest(motherId: string, status: "scheduled" | "resolved" = "scheduled") {
  return apiFetch<{ item: Record<string, unknown>; source?: string }>("/api/video-requests", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motherId, status }),
  });
}

export function fetchVideoSession(appointmentId: string) {
  return apiFetch<{
    item: Record<string, unknown> | null;
    appointment?: Record<string, unknown>;
    source?: string;
  }>(`/api/video-sessions?appointmentId=${encodeURIComponent(appointmentId)}`);
}

export function completeVideoSession(appointmentId: string, transcript: string) {
  return apiFetch<{
    item: Record<string, unknown>;
    appointment: Record<string, unknown>;
    source?: string;
  }>("/api/video-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appointmentId, transcript, complete: true }),
  });
}

export function fetchTeam(hospitalId?: string) {
  const query = hospitalId ? `?hospitalId=${encodeURIComponent(hospitalId)}` : "";
  return apiFetch<ApiListResponse>(`/api/team${query}`);
}

export interface DashboardMetricsResponse {
  scope?: "hospital" | "assigned";
  metrics: {
    totalMothers: number;
    activePregnancies: number;
    highRiskCases: number;
    todayAppointments: number;
    missedFollowUps: number;
    postpartumMothers: number;
    medicationAdherence: number;
    appointmentAdherence?: number;
    careContinuityScore: number;
    teamMembers: number;
  };
  assignedPatients?: Record<string, unknown>[];
  needFollowUp: Record<string, unknown>[];
  upcomingAppointments: Record<string, unknown>[];
  teamSnapshot: Record<string, unknown>[];
  recentAlerts?: Array<{
    patient: string;
    patientId?: string;
    note: string;
    severity: "high" | "medium" | "low";
    time: string;
  }>;
  source?: string;
}

export function fetchDashboardMetrics(hospitalId?: string) {
  const query = hospitalId ? `?hospitalId=${encodeURIComponent(hospitalId)}` : "";
  return apiFetch<DashboardMetricsResponse>(`/api/dashboard/metrics${query}`);
}

export function fetchCarePlanSummaries(tab: "all" | "assigned" | "unassigned" = "all") {
  return apiFetch<{ items: Record<string, unknown>[]; source?: string }>(
    `/api/care-plans?tab=${encodeURIComponent(tab)}`,
  );
}

export function fetchCarePlan(motherId: string) {
  return apiFetch<{ item: Record<string, unknown>; source?: string; canEdit?: boolean }>(
    `/api/care-plans/${encodeURIComponent(motherId)}`,
  );
}

export function saveCarePlan(
  motherId: string,
  payload: {
    sections?: unknown[];
    motherChecklist?: unknown[];
    education?: unknown[];
    dailyChecklist?: {
      items: { id?: string; text: string }[];
      durationDays: number;
      startDate?: string;
    };
  },
) {
  return apiFetch<{ item: Record<string, unknown>; source?: string; canEdit?: boolean }>(
    `/api/care-plans/${encodeURIComponent(motherId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

export function patchCarePlanChecklist(motherId: string, toggleItemId: string) {
  return apiFetch<{ item: Record<string, unknown>; source?: string; canEdit?: boolean }>(
    `/api/care-plans/${encodeURIComponent(motherId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toggleItemId }),
    },
  );
}

export async function assignMotherStaff(
  motherId: string,
  payload: {
    assignedNurseUserId?: string | null;
    assignedDoctorUserId?: string | null;
    nurse?: string;
    doctor?: string;
  },
) {
  const res = await apiFetch<{ item: Record<string, unknown>; source?: string }>(
    `/api/mothers/${encodeURIComponent(motherId)}/assign`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (res.item) writeMotherOverride(motherId, res.item);
  return res;
}

export function sendMessage(payload: { patientId: string; subject?: string; text: string }) {
  return createChatThread({
    patientId: payload.patientId,
    specialistUserId: "user-nurse",
    subject: payload.subject,
    text: payload.text,
  });
}

export function fetchChatThreads() {
  return apiFetch<{ items: Record<string, unknown>[]; source?: string }>(
    "/api/messages/threads",
  );
}

export function createChatThread(payload: {
  patientId: string;
  specialistUserId: string;
  subject?: string;
  text: string;
}) {
  return apiFetch<{
    thread: Record<string, unknown>;
    message: Record<string, unknown>;
    source?: string;
  }>("/api/messages/threads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function fetchChatMessages(threadId: string) {
  return apiFetch<{
    thread: Record<string, unknown>;
    items: Record<string, unknown>[];
    source?: string;
  }>(`/api/messages/threads/${encodeURIComponent(threadId)}`);
}

export function sendChatMessage(
  threadId: string,
  payload: { text: string; urgent?: boolean },
) {
  return apiFetch<{
    item: Record<string, unknown>;
    thread: Record<string, unknown>;
    source?: string;
  }>(`/api/messages/threads/${encodeURIComponent(threadId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function markChatThreadRead(threadId: string) {
  return apiFetch<{ thread: Record<string, unknown>; source?: string }>(
    `/api/messages/threads/${encodeURIComponent(threadId)}`,
    { method: "PATCH" },
  );
}

export function editChatMessage(
  threadId: string,
  payload: { messageId: string; text: string },
) {
  return apiFetch<{
    item: Record<string, unknown>;
    source?: string;
  }>(`/api/messages/threads/${encodeURIComponent(threadId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "edit", ...payload }),
  });
}

export function deleteChatMessage(threadId: string, messageId: string) {
  return apiFetch<{
    item: Record<string, unknown>;
    source?: string;
  }>(`/api/messages/threads/${encodeURIComponent(threadId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete", messageId }),
  });
}

export function fetchNotifications() {
  return apiFetch<ApiListResponse>("/api/notifications");
}

export function markNotificationRead(id: string) {
  return apiFetch<{ item: Record<string, unknown>; source?: string }>(
    `/api/notifications/${encodeURIComponent(id)}`,
    { method: "PATCH" },
  );
}

export function fetchMessages(patientId?: string) {
  const query = patientId ? `?patientId=${encodeURIComponent(patientId)}` : "";
  return apiFetch<ApiListResponse>(`/api/messages${query}`);
}

export function fetchPregnancyTimeline(motherId: string) {
  return apiFetch<{
    motherId: string;
    motherName?: string;
    gestationalWeek?: number;
    stages: Record<string, unknown>[];
    source?: string;
  }>(`/api/pregnancy/${encodeURIComponent(motherId)}`);
}

export function fetchTimeline(motherId: string) {
  const query = `?motherId=${encodeURIComponent(motherId)}`;
  return apiFetch<ApiListResponse>(`/api/timeline${query}`);
}

export type AnalyticsRange = "1m" | "3m" | "6m" | "1y";

export interface AnalyticsResponse {
  range: AnalyticsRange;
  metrics: {
    enrolledMothers: number;
    activeCarePlans: number;
    missedApptRate: number;
    medicationAdherence: number;
    appointmentAdherence: number;
    checklistAdherence: number | null;
    careContinuityScore: number;
    postpartumFollowUp: number;
    messageResponseRate: number;
    avgNurseResponseHours: number | null;
    highRiskCases: number;
    activePregnancies: number;
    postpartumMothers: number;
  };
  adherenceTrend: Array<{
    month: string;
    medication: number;
    appointment: number;
    checklist: number;
  }>;
  riskDistribution: Array<{ name: string; value: number; color: string }>;
  appointmentAttendance: Array<{ month: string; attended: number; missed: number }>;
  nurseResponseTrend: Array<{ week: string; avg: number | null }>;
  engagementRows: Array<{ metric: string; current: string; target: string; ok: boolean }>;
  source?: string;
}

export function fetchAnalytics(range: AnalyticsRange = "6m") {
  return apiFetch<AnalyticsResponse>(`/api/analytics?range=${encodeURIComponent(range)}`);
}

export interface CareBriefRecord {
  id: string;
  motherId: string;
  motherName: string;
  generatedAt: string;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  clinicianNote?: string;
  summary: string;
  dataSources?: Array<{ category: string; detail: string }>;
  riskCues: string[];
  adherenceSummary: {
    medication: number;
    appointment: number;
    checklist: number | null;
    missedVisits: number;
  };
  suggestedFollowups: string[];
}

export interface CareBriefListItem {
  motherId: string;
  motherName: string;
  initials: string;
  riskLevel: string;
  gestationalWeek: number;
  canEdit: boolean;
  brief: CareBriefRecord | null;
}

export function fetchCareBriefs() {
  return apiFetch<{ items: CareBriefListItem[]; source?: string }>("/api/care-briefs");
}

export function regenerateAllCareBriefs() {
  return apiFetch<{ count: number; items: CareBriefRecord[]; source?: string }>(
    "/api/care-briefs",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerateAll: true }),
    },
  );
}

export function fetchCareBrief(motherId: string, generate = true) {
  const q = generate ? "" : "?generate=false";
  return apiFetch<{ item: CareBriefRecord | null; canEdit: boolean; source?: string }>(
    `/api/care-briefs/${encodeURIComponent(motherId)}${q}`,
  );
}

export function regenerateCareBrief(motherId: string) {
  return apiFetch<{ item: CareBriefRecord; canEdit: boolean; source?: string }>(
    `/api/care-briefs/${encodeURIComponent(motherId)}`,
    { method: "POST" },
  );
}

export function patchCareBrief(
  motherId: string,
  payload: { reviewed?: boolean; clinicianNote?: string },
) {
  return apiFetch<{ item: CareBriefRecord; canEdit: boolean; source?: string }>(
    `/api/care-briefs/${encodeURIComponent(motherId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

export function fetchHealth() {
  return apiFetch<{ ok: boolean; region: string | null; table: string | null; hasAwsRole: boolean }>("/api/health");
}

export function fetchSymptoms(patientId: string) {
  return apiFetch<ApiListResponse>(`/api/symptoms?patientId=${encodeURIComponent(patientId)}`);
}

export function logSymptom(payload: {
  patientId: string;
  symptom: string;
  severity?: "mild" | "moderate" | "severe";
  notes?: string;
  updateConcerns?: boolean;
}) {
  return apiFetch<{ item: Record<string, unknown>; source?: string }>("/api/symptoms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function fetchLabs(patientId: string) {
  return apiFetch<ApiListResponse>(`/api/labs?patientId=${encodeURIComponent(patientId)}`);
}

export function addLabNote(payload: {
  patientId: string;
  notes: string;
  test?: string;
  result?: string;
  flag?: "normal" | "mild-concern" | "concern";
}) {
  return apiFetch<{ item: Record<string, unknown>; source?: string }>("/api/labs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function fetchClinicalNotes(patientId: string) {
  return apiFetch<ApiListResponse>(`/api/clinical-notes?patientId=${encodeURIComponent(patientId)}`);
}

export function addClinicalNote(payload: { patientId: string; note: string; category?: string }) {
  return apiFetch<{ item: Record<string, unknown>; source?: string }>("/api/clinical-notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function fetchActivityLog(limit = 50) {
  return apiFetch<ApiListResponse>(`/api/activity-log?limit=${limit}`);
}

export function seedDatabase() {
  return apiFetch<{ table: string; seeded: SeedCounts }>("/api/seed", { method: "POST" });
}
