import type { Role } from "@/types/clinical.js";

/** Routes mothers cannot access (staff-only clinical tools) */
export const STAFF_ONLY_PREFIXES = [
  "/dashboard/mothers",
  "/dashboard/team",
  "/dashboard/analytics",
  "/dashboard/care-briefs",
  "/dashboard/timeline",
];

export function isStaffOnlyPath(pathname: string): boolean {
  return STAFF_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function defaultDashboardPath(role: Role, onboardingComplete?: boolean): string {
  if (role === "mother") {
    return onboardingComplete === false ? "/dashboard/onboarding" : "/dashboard/mother";
  }
  return "/dashboard";
}

export function canAccessPath(role: Role, pathname: string): boolean {
  if (role === "mother" && pathname.startsWith("/dashboard/onboarding")) return true;
  if (role === "mother" && isStaffOnlyPath(pathname)) return false;
  if (role !== "mother" && pathname === "/dashboard/mother") return false;

  if (role === "nurse" && pathname.startsWith("/dashboard/team")) return false;
  if (role === "nurse" && pathname.startsWith("/dashboard/analytics")) return false;

  return true;
}
