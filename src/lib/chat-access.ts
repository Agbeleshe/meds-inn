import type { ChatThread } from "../types/clinical.js";
import { isAssignedToMotherById } from "./assignments.js";

type UserRef = {
  id: string;
  role: "admin" | "nurse" | "doctor" | "mother";
  motherId?: string;
  hospitalId?: string;
};

type MotherRef = {
  id: string;
  name?: string;
  assignedNurseUserId?: string | null;
  assignedDoctorUserId?: string | null;
  nurse?: string;
  doctor?: string;
  hospitalId?: string;
};

export function filterChatThreadsForUser(
  threads: ChatThread[],
  user: UserRef,
): ChatThread[] {
  const hospitalId = user.hospitalId ?? "ELR";
  const scoped = threads.filter((t) => t.hospitalId === hospitalId);

  if (user.role === "admin") return scoped;
  if (user.role === "mother") {
    return scoped.filter((t) => t.patientId === user.motherId);
  }
  if (user.role === "nurse" || user.role === "doctor") {
    return scoped.filter((t) => t.specialistUserId === user.id);
  }
  return [];
}

export function canAccessChatThread(user: UserRef, thread: ChatThread): boolean {
  if (user.role === "admin") return thread.hospitalId === (user.hospitalId ?? "ELR");
  if (user.role === "mother") return thread.patientId === user.motherId;
  if (user.role === "nurse" || user.role === "doctor") {
    return thread.specialistUserId === user.id;
  }
  return false;
}

export function canStartChatWithSpecialist(
  user: UserRef,
  mother: MotherRef,
  specialistUserId: string,
): boolean {
  if (user.role === "mother") {
    if (mother.id !== user.motherId) return false;
    return (
      mother.assignedNurseUserId === specialistUserId ||
      mother.assignedDoctorUserId === specialistUserId
    );
  }
  if (user.role === "admin") return true;
  if (user.role === "nurse" || user.role === "doctor") {
    return isAssignedToMotherById(user, mother) && user.id === specialistUserId;
  }
  return false;
}

export function specialistOnMotherCase(
  mother: MotherRef,
  specialistUserId: string,
): boolean {
  return (
    mother.assignedNurseUserId === specialistUserId ||
    mother.assignedDoctorUserId === specialistUserId
  );
}
