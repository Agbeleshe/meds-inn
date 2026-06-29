import type { Mother, Role, UserProfile, Medication } from "@/types/clinical";

/** Map display names from seed data → demo USER# ids */
export const STAFF_USER_IDS: Record<string, string> = {
  "Elena Costa": "user-nurse",
  "Nurse Elena Costa": "user-nurse",
  "Dr. Priya Sharma": "user-doctor",
  "Priya Sharma": "user-doctor",
};

export function resolveNurseUserId(nurseName: string): string | null {
  if (!nurseName || nurseName === "To be assigned") return null;
  return STAFF_USER_IDS[nurseName] ?? STAFF_USER_IDS[`Nurse ${nurseName}`] ?? null;
}

export function resolveDoctorUserId(doctorName: string): string | null {
  if (!doctorName || doctorName === "To be assigned") return null;
  const normalized = doctorName.startsWith("Dr. ") ? doctorName : `Dr. ${doctorName}`;
  return STAFF_USER_IDS[doctorName] ?? STAFF_USER_IDS[normalized] ?? null;
}

export function isAssignedToMother(
  user: Pick<UserProfile, "id" | "role" | "name">,
  mother: Pick<Mother, "assignedNurseUserId" | "assignedDoctorUserId" | "nurse" | "doctor">,
): boolean {
  if (user.role === "admin") return true;
  if (user.role === "nurse") {
    if (mother.assignedNurseUserId) return mother.assignedNurseUserId === user.id;
    if (user.name && mother.nurse && mother.nurse !== "To be assigned") {
      return clinicianMatchesUser(mother.nurse, user);
    }
    return false;
  }
  if (user.role === "doctor") {
    if (mother.assignedDoctorUserId) return mother.assignedDoctorUserId === user.id;
    if (user.name && mother.doctor && mother.doctor !== "To be assigned") {
      return clinicianMatchesUser(mother.doctor, user);
    }
    return false;
  }
  return false;
}

/** Fast ID-only assignment check — use when user name may be unavailable. */
export function isAssignedToMotherById(
  user: Pick<UserProfile, "id" | "role">,
  mother: Pick<Mother, "assignedNurseUserId" | "assignedDoctorUserId">,
): boolean {
  if (user.role === "admin") return true;
  if (user.role === "nurse") return mother.assignedNurseUserId === user.id;
  if (user.role === "doctor") return mother.assignedDoctorUserId === user.id;
  return false;
}

export function canPrescribeMedicationForPatient(
  user: Pick<UserProfile, "id" | "role" | "name">,
  mother: Pick<Mother, "assignedNurseUserId" | "assignedDoctorUserId" | "nurse" | "doctor">,
): boolean {
  if (user.role === "admin") return true;
  if (user.role === "mother") return false;
  return isAssignedToMother(user, mother);
}

export function canEditMotherCare(
  user: Pick<UserProfile, "id" | "role" | "name">,
  mother: Pick<Mother, "assignedNurseUserId" | "assignedDoctorUserId" | "nurse" | "doctor">,
): boolean {
  return isAssignedToMother(user, mother);
}

export function filterMothersForRole(
  mothers: Mother[],
  user: Pick<UserProfile, "id" | "role" | "motherId" | "hospitalId">,
): Mother[] {
  const hospitalId = user.hospitalId ?? "ELR";
  const scoped = mothers.filter((m) => String(m.hospitalId ?? "ELR") === hospitalId);

  if (user.role === "admin") return scoped;
  if (user.role === "mother") {
    return scoped.filter((m) => m.id === user.motherId);
  }
  if (user.role === "nurse" || user.role === "doctor") {
    return scoped.filter((m) => isAssignedToMother(user, m));
  }
  return [];
}

export function filterMothersByAssignmentTab(
  mothers: Mother[],
  user: Pick<UserProfile, "id" | "role">,
  tab: "all" | "assigned" | "unassigned",
): Mother[] {
  if (user.role === "admin") {
    if (tab === "assigned") {
      return mothers.filter((m) => m.assignedNurseUserId || m.assignedDoctorUserId);
    }
    if (tab === "unassigned") {
      return mothers.filter((m) => !m.assignedNurseUserId && !m.assignedDoctorUserId);
    }
    return mothers;
  }

  if (tab === "assigned") {
    return mothers.filter((m) => isAssignedToMother(user, m));
  }

  // Specialists only see mothers assigned to them (same as "assigned" tab)
  return mothers.filter((m) => isAssignedToMother(user, m));
}

export function clinicianMatchesUser(
  clinician: string,
  user: Pick<UserProfile, "name" | "role">,
): boolean {
  if (!clinician || !user.name) return false;
  const cleanClinician = clinician.toLowerCase().replace(/^(dr\.|dr|nurse)\s+/, "").trim();
  const cleanUser = user.name.toLowerCase().replace(/^(dr\.|dr|nurse)\s+/, "").trim();
  return cleanClinician === cleanUser || cleanClinician.includes(cleanUser) || cleanUser.includes(cleanClinician);
}

export function filterAppointmentsForRole<T extends { patientId?: string; clinician?: string }>(
  items: T[],
  user: Pick<UserProfile, "id" | "role" | "motherId" | "name">,
  mothers: Pick<Mother, "id" | "assignedNurseUserId" | "assignedDoctorUserId">[],
): T[] {
  if (user.role === "admin") return items;
  if (user.role === "mother") {
    return items.filter((a) => a.patientId === user.motherId);
  }

  const motherMap = new Map(mothers.map((m) => [m.id, m]));

  return items.filter((a) => {
    const mother = a.patientId ? motherMap.get(a.patientId) : undefined;
    if (user.role === "nurse" && mother?.assignedNurseUserId === user.id) return true;
    if (user.role === "doctor" && mother?.assignedDoctorUserId === user.id) return true;
    if (a.clinician && clinicianMatchesUser(a.clinician, user)) return true;
    return false;
  });
}

export function filterMedicationsForRole<
  T extends { patientId?: string; prescribedByUserId?: string; hospitalId?: string },
>(
  items: T[],
  user: Pick<UserProfile, "id" | "role" | "motherId" | "hospitalId">,
): T[] {
  const hospitalId = user.hospitalId ?? "ELR";
  const scoped = items.filter((m) => String(m.hospitalId ?? "ELR") === hospitalId);

  if (user.role === "admin") return scoped;
  if (user.role === "mother") {
    return scoped.filter((m) => m.patientId === user.motherId);
  }
  return scoped.filter((m) => m.prescribedByUserId === user.id);
}

export function canEditMedication(
  user: Pick<UserProfile, "id" | "role">,
  medication: Pick<Medication, "prescribedByUserId">,
): boolean {
  if (user.role === "admin") return true;
  if (user.role === "mother") return false;
  return medication.prescribedByUserId === user.id;
}

export function isMotherUnassigned(
  mother: Pick<Mother, "assignedNurseUserId" | "assignedDoctorUserId">,
): boolean {
  return !mother.assignedNurseUserId && !mother.assignedDoctorUserId;
}

/** True when admin has assigned at least one specialist by user id. */
export function isMotherAssigned(
  mother: Pick<Mother, "assignedNurseUserId" | "assignedDoctorUserId">,
): boolean {
  return Boolean(mother.assignedNurseUserId || mother.assignedDoctorUserId);
}

export function hasPendingSpecialistRequest(
  mother: Pick<Mother, "specialistRequestStatus" | "specialistRequestType">,
): boolean {
  return mother.specialistRequestStatus === "pending" && Boolean(mother.specialistRequestType);
}

export type StaffRole = Extract<Role, "admin" | "nurse" | "doctor">;
