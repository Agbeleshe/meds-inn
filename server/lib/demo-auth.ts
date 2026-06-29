import { DEMO_USERS } from "../../src/lib/demo-users.js";

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** In-memory demo accounts when DynamoDB is unreachable or not seeded */
export function findDemoUserRecord(email: string, role: string, hospitalId: string) {
  const normalized = email.trim().toLowerCase();
  const user = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === normalized && u.role === role && u.hospitalId === hospitalId,
  );
  if (!user) return null;
  return { ...user } as Record<string, unknown>;
}

export function getDemoUserRecordById(userId: string) {
  const user = DEMO_USERS.find((u) => u.id === userId);
  if (!user) return null;
  return { ...user } as Record<string, unknown>;
}

export function isDemoUserId(userId: string) {
  return DEMO_USERS.some((u) => u.id === userId);
}
