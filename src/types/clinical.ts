/** Shared clinical & app types — source of truth for API + UI */

export type Role = "admin" | "nurse" | "doctor" | "mother";
export type RiskLevel = "low" | "moderate" | "high";
export type AppointmentStatus = "scheduled" | "completed" | "missed" | "cancelled";
export type PatientStatus = "active-pregnancy" | "postpartum" | "delivered" | "new" | "missed-followup";
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
  assignedNurseUserId?: string | null;
  assignedDoctorUserId?: string | null;
  specialistRequestType?: SpecialistRequestType | null;
  specialistRequestNote?: string | null;
  specialistRequestAt?: string | null;
  specialistRequestStatus?: "pending" | "resolved" | null;
  escalationNote?: string | null;
  escalationSeverity?: "urgent" | "serious" | "mild" | null;
  escalationAt?: string | null;
  escalationBy?: string | null;
  escalationByUserId?: string | null;
  escalationStatus?: "open" | "resolved" | null;
  escalationTargets?: ("doctor" | "nurse" | "admin")[];
  videoCallRequestStatus?: "pending" | "scheduled" | null;
  videoCallRequestNote?: string | null;
  videoCallRequestAt?: string | null;
}

export type SpecialistRequestType = "request" | "change" | "report";

export interface DailyChecklistItem {
  id: string;
  text: string;
}

export interface DailyChecklistAssignment {
  items: DailyChecklistItem[];
  startDate: string;
  durationDays: number;
  endDate: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  lastFinalizedDate?: string;
}

export interface ChecklistDaySummary {
  date: string;
  completedCount: number;
  abscondedCount: number;
  totalCount: number;
  abscondedItems: { id: string; text: string }[];
  completed: boolean;
}

export interface ChecklistAdherenceStats {
  totalDays: number;
  daysTracked: number;
  totalTasksPossible: number;
  totalTasksCompleted: number;
  totalAbsconded: number;
  adherencePercent: number;
  daySummaries: ChecklistDaySummary[];
}

export interface MotherChecklistItem {
  id: string;
  text: string;
  done: boolean;
  setBy: string;
  setAt: string;
}

export interface CareEducationItem {
  id: string;
  title: string;
  body: string;
}

export interface CarePlan {
  motherId: string;
  sections: CarePlanSection[];
  motherChecklist: MotherChecklistItem[];
  education: CareEducationItem[];
  dailyChecklist?: DailyChecklistAssignment | null;
  checklistAdherence?: ChecklistAdherenceStats | null;
  todayDate?: string;
  yesterdayDate?: string;
  yesterdaySummary?: ChecklistDaySummary | null;
  assignmentActive?: boolean;
  updatedAt?: string;
}

export interface CarePlanSummary {
  motherId: string;
  motherName: string;
  gestationalWeek: number;
  assignedNurseUserId?: string | null;
  assignedDoctorUserId?: string | null;
  nurse: string;
  doctor: string;
  checklistTotal: number;
  checklistDone: number;
  checklistAdherence?: number;
  hasDailyChecklist?: boolean;
  canEdit: boolean;
  isAssignedToMe: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: "assignment" | "message" | "care-plan" | "specialist-request" | "medication" | "appointment";
  title: string;
  body: string;
  read: boolean;
  motherId?: string;
  appointmentId?: string;
  createdAt: string;
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
  createdAt?: string;
  createdByUserId?: string;
  rescheduled?: boolean;
  rescheduledAt?: string;
  videoRoomId?: string;
  reminderSent?: boolean;
  completedAt?: string;
  motherMarkedAttended?: boolean;
  motherMarkedAt?: string;
  clinicianConfirmed?: boolean;
  clinicianConfirmedAt?: string;
  confirmedBy?: string;
  attendanceNote?: string;
}

export interface ClinicalDocument {
  id: string;
  patientId?: string;
  name: string;
  category: string;
  date: string;
  uploadedBy: string;
  size: string;
  type: string;
  status: string;
}

export interface BabySymptom {
  id: string;
  motherId: string;
  date: string;
  symptom: string;
  severity: "mild" | "moderate" | "severe";
  notes: string;
  recordedAt: string;
}

export interface BabyMedication {
  id: string;
  motherId: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  active: boolean;
  adherence: number;
  prescribedBy: string;
  startDate: string;
  updatedAt: string;
}

export interface BabyChecklistItem {
  id: string;
  text: string;
  done?: boolean;
}

export interface BabyProfile {
  motherId: string;
  babyName: string;
  birthDate: string;
  birthWeight: string;
  currentWeight: string;
  birthLength: string;
  deliveryType: string;
  feedingMethod: string;
  bloodGroup: string;
  gender?: string;
  apgarScore: string;
  notes: string;
  updatedAt: string;
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
  prescribedByUserId?: string;
  scheduleTimes?: string[];
  adherence: number;
  missedDoses: number;
  lastTaken: string;
  notes: string;
  hospitalId?: string;
  active?: boolean;
}

export type MedicationDoseStatus = "pending" | "taken" | "skipped" | "missed";

export interface MedicationDose {
  id: string;
  medicationId: string;
  patientId: string;
  medicationName?: string;
  dosage?: string;
  date: string;
  scheduledTime: string;
  status: MedicationDoseStatus;
  recordedAt?: string;
  recordedBy?: string;
}

export interface MessageThreadEntry {
  from: string;
  role: string;
  time: string;
  text: string;
}

/** @deprecated Legacy inbox shape — prefer ChatThread + ChatMessage */
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

export interface ChatThread {
  id: string;
  patientId: string;
  patientName: string;
  specialistUserId: string;
  specialistName: string;
  specialistRole: 'nurse' | 'doctor';
  hospitalId: string;
  subject: string;
  preview: string;
  lastMessageAt: string;
  unreadForPatient: boolean;
  unreadForSpecialist: boolean;
  urgent: boolean;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  patientId: string;
  senderUserId: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: string;
  urgent?: boolean;
  /** Soft-deleted — hidden text for non-admins */
  deleted?: boolean;
  deletedAt?: string;
  edited?: boolean;
  editedAt?: string;
  /** Original text before first edit (admin audit) */
  originalText?: string;
  /** Prior versions after each edit (admin audit) */
  editHistory?: string[];
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

export type SymptomSeverity = "mild" | "moderate" | "severe";

export interface SymptomLogEntry {
  id: string;
  patientId: string;
  date: string;
  symptom: string;
  severity: SymptomSeverity;
  notes: string;
  recordedAt: string;
  recordedBy: string;
  recordedByRole: string;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  date: string;
  note: string;
  authorName: string;
  authorRole: string;
  category?: string;
  createdAt: string;
}

export interface ActivityLogEntry {
  id: string;
  hospitalId: string;
  category: string;
  action: string;
  detail: string;
  actorName: string;
  actorRole: string;
  patientId?: string;
  patientName?: string;
  appointmentId?: string;
  createdAt: string;
}

export interface VideoSessionNotes {
  id: string;
  appointmentId: string;
  patientId: string;
  transcript: string;
  structuredNotes: string;
  clinicianName: string;
  appointmentType: string;
  recordedByName: string;
  createdAt: string;
  completedAt: string;
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
  | "NOTIFICATION"
  | "TIMELINE"
  | "CAREBRIEF"
  | "ANALYTICS";

export interface CarePlanItem {
  label: string;
  done: boolean;
  note?: string;
}

export interface CarePlanSection {
  id: string;
  iconId: string;
  title: string;
  reviewedBy: string;
  reviewDate: string;
  items: CarePlanItem[];
}

export type TimelineEventType = "appointment" | "nurse-note" | "lab" | "scan" | "note";

export interface TimelineEvent {
  id: string;
  patientId?: string;
  date: string;
  type: TimelineEventType;
  title: string;
  note: string;
  by: string;
}

export type PregnancyStageStatus = "completed" | "current" | "upcoming";

export interface PregnancyStage {
  id: string;
  name: string;
  weeks: string;
  status: PregnancyStageStatus;
  currentWeek?: number;
  goals: string[];
  changes: string[];
  checkups: string[];
  hospitalTasks: string[];
  nurseTouchpoints: string[];
  education: string[];
  medications: string[];
  warnings: string[];
  nextSteps: string;
}
