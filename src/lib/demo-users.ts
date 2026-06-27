import type { Role } from "@/types/clinical";
import { HOSPITALS } from "./hospitals";

/** Demo staff & patients — usernames are full names (normalized lowercase in DB) */
export interface DemoUserSeed {
  id: string;
  username: string;
  password: string;
  role: Role;
  name: string;
  initials: string;
  email: string;
  hospitalId: string;
  specialty?: string;
  motherId?: string;
  onboardingComplete?: boolean;
}

export const DEMO_USERS: DemoUserSeed[] = [
  {
    id: "user-admin",
    username: "diana harrington",
    password: "demo123",
    role: "admin",
    name: "Diana Harrington",
    initials: "DH",
    email: "diana.harrington@elara-wsc.com",
    hospitalId: "ELR",
    specialty: "Hospital Administration",
    onboardingComplete: true,
  },
  {
    id: "user-nurse",
    username: "elena costa",
    password: "demo123",
    role: "nurse",
    name: "Elena Costa",
    initials: "EC",
    email: "elena.costa@elara-wsc.com",
    hospitalId: "ELR",
    specialty: "Senior Midwife",
    onboardingComplete: true,
  },
  {
    id: "user-doctor",
    username: "priya sharma",
    password: "demo123",
    role: "doctor",
    name: "Dr. Priya Sharma",
    initials: "PS",
    email: "priya.sharma@elara-wsc.com",
    hospitalId: "ELR",
    specialty: "Obstetrics & Gynaecology",
    onboardingComplete: true,
  },
  {
    id: "user-mother-elr",
    username: "sofia marchetti",
    password: "demo123",
    role: "mother",
    name: "Sofia Marchetti",
    initials: "SM",
    email: "sofia.marchetti@patient.elara-wsc.com",
    hospitalId: "ELR",
    motherId: "MED-ELR-24018",
    onboardingComplete: true,
  },
  {
    id: "user-mother-sun",
    username: "yuki tanaka",
    password: "demo123",
    role: "mother",
    name: "Yuki Tanaka",
    initials: "YT",
    email: "yuki.tanaka@patient.sunrise-mc.com",
    hospitalId: "ELR",
    motherId: "MED-ELR-24031",
    onboardingComplete: true,
  },
];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Hospital Admin",
  nurse: "Nurse / Midwife",
  doctor: "Doctor",
  mother: "Mother / Patient",
};

export { HOSPITALS };
