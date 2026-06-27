/** Shared clinical & app types — source of truth for API + UI */

export type Role = "admin" | "nurse" | "doctor" | "mother";
export type RiskLevel = "low" | "moderate" | "high";
export type AppointmentStatus = "scheduled" | "completed" | "missed" | "cancelled";
export type PatientStatus = "active-pregnancy" | "postpartum" | "new" | "missed-followup";
export type TeamRole = "admin" | "doctor" | "nurse";
export type TeamStatus = "active" | "away" | "offline";
export type DocumentStatus = "reviewed" | "pending" | "archived" | "signed";
export type LabFlag = "normal" | "mild-concern" | "concern";
export type VaccinationStatus = "given" | "due" | "upcoming";

export interface Hospital {
  id: string;
  name: string;
  shortName: string;
  location: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  hospitalId: string;
  initials: string;
  specialty?: string;
  phone?: string;
  motherId?: string;
  careStage?: "pregnant" | "postpartum";
  gestationalWeeks?: number;
  babyWeeks?: number;
  notes?: string;
  onboardingComplete?: boolean;
}

export interface WaitlistEntry {
  email: string;
  type: "hospital";
  createdAt: string;
}

export interface Mother {
  id: string;
  name: string;
  initials: string;
  age: number;
  gestationalWeek: number;
  trimester: string;
  riskLevel: RiskLevel;
  status: PatientStatus;
  nurse: string;
  doctor: string;
  lastCheckIn: string;
  nextAppointment: string;
  adherence: number;
  edd: string;
  bloodGroup: string;
  allergies: string;
  phone: string;
  concerns: string[];
  emergencyContact: string;
  hospitalId?: string;
  onboardingComplete?: boolean;
  careStage?: "pregnant" | "postpartum";
  babyWeeks?: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patient: string;
  type: string;
  clinician: string;
  date: string;
  time: string;
  mode: string;
  status: AppointmentStatus;
  reason: string;
  duration: number;
  location: string;
  hospitalId?: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  instructions: string;
  startDate: string;
  endDate: string;
  prescribedBy: string;
  adherence: number;
  missedDoses: number;
  lastTaken: string;
  notes: string;
}

export interface MessageThreadEntry {
  from: string;
  role: string;
  time: string;
  text: string;
}

export interface Message {
  id: string;
  patientId?: string;
  from: string;
  role: string;
  initials: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  urgent: boolean;
  tag: string;
  thread: MessageThreadEntry[];
}

export interface LabResult {
  id: string;
  patientId?: string;
  test: string;
  date: string;
  result: string;
  status: string;
  flag: LabFlag;
  notes: string;
  orderedBy: string;
}

export interface Document {
  id: string;
  patientId?: string;
  name: string;
  category: string;
  date: string;
  uploadedBy: string;
  size: string;
  type: string;
  status: DocumentStatus;
  s3Key?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  specialty: string;
  initials: string;
  assignedMothers: number;
  activeFollowUps: number;
  workloadPct: number;
  status: TeamStatus;
  email: string;
  phone: string;
  lastActive: string;
  permission: string;
}

export interface DashboardMetrics {
  totalMothers: number;
  activePregnancies: number;
  highRiskCases: number;
  todayAppointments: number;
  missedFollowUps: number;
  postpartumMothers: number;
  babiesFirstYear: number;
  vaccinationAdherence: number;
  avgNurseResponseTime: string;
  medicationAdherence: number;
  careContinuityScore: number;
}

export interface VaccinationEntry {
  ageLabel: string;
  vaccine: string;
  dueDate: string;
  givenDate: string | null;
  status: VaccinationStatus;
}

export interface MilestoneEntry {
  ageLabel: string;
  milestone: string;
  achieved: boolean;
  achievedDate?: string;
}

export type EntityType =
  | "HOSPITAL"
  | "USER"
  | "MOTHER"
  | "APPOINTMENT"
  | "TEAM"
  | "MEDICATION"
  | "MESSAGE"
  | "DOCUMENT"
  | "LAB"
  | "CAREPLAN"
  | "CAREBRIEF"
  | "ANALYTICS";
