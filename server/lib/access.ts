import { isAssignedToMother } from "../../src/lib/assignments.js";

/** Shared mother access checks for authenticated API routes */
export function canAccessMother(
  user: Record<string, unknown>,
  mother: Record<string, unknown>,
) {
  const role = String(user.role);
  const sameHospital =
    String(user.hospitalId) === String(mother.hospitalId ?? "ELR");

  if (role === "mother") {
    return String(user.motherId) === String(mother.id);
  }
  if (role === "admin") {
    return sameHospital;
  }
  if (role === "nurse" || role === "doctor") {
    const motherRef = {
      assignedNurseUserId: (mother.assignedNurseUserId as string | null) ?? null,
      assignedDoctorUserId: (mother.assignedDoctorUserId as string | null) ?? null,
      nurse: String(mother.nurse ?? ""),
      doctor: String(mother.doctor ?? ""),
    };
    const userRef = {
      id: String(user.id),
      role: role as "nurse" | "doctor",
      name: String(user.name ?? ""),
    };
    if (role === "nurse") {
      if (motherRef.assignedNurseUserId) {
        return sameHospital && motherRef.assignedNurseUserId === userRef.id;
      }
      return sameHospital && isAssignedToMother(userRef, motherRef);
    }
    if (motherRef.assignedDoctorUserId) {
      return sameHospital && motherRef.assignedDoctorUserId === userRef.id;
    }
    return sameHospital && isAssignedToMother(userRef, motherRef);
  }
  return false;
}

export function canAccessMotherId(
  user: Record<string, unknown>,
  motherId: string,
  hospitalId = "ELR",
) {
  const role = String(user.role);
  if (role === "mother") {
    return String(user.motherId) === motherId;
  }
  if (role === "admin") {
    return String(user.hospitalId) === hospitalId;
  }
  if (role === "nurse" || role === "doctor") {
    return String(user.hospitalId) === hospitalId;
  }
  return false;
}
