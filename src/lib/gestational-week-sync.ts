import { trimesterFromWeeks } from "./pregnancy-dates.js";

/** Gestational week from EDD (40-week pregnancy, ISO date YYYY-MM-DD). */
export function gestationalWeekFromEdd(edd: string, referenceDate = new Date()): number | null {
  if (!edd || !/^\d{4}-\d{2}-\d{2}$/.test(edd)) return null;
  const due = new Date(`${edd}T12:00:00`);
  const ref = new Date(referenceDate);
  ref.setHours(12, 0, 0, 0);
  const daysUntilDue = Math.round((due.getTime() - ref.getTime()) / 86400000);
  const weeks = Math.floor((280 - daysUntilDue) / 7);
  if (weeks < 1 || weeks > 42) return null;
  return weeks;
}

export function syncGestationalWeek(params: {
  gestationalWeek: number;
  edd?: string;
  careStage?: "pregnant" | "postpartum";
  status?: string;
}): { week: number; trimester: string; changed: boolean } | null {
  if (params.careStage === "postpartum" || params.status === "postpartum") return null;
  const fromEdd = params.edd ? gestationalWeekFromEdd(params.edd) : null;
  const week = fromEdd ?? params.gestationalWeek;
  if (week <= 0) return null;
  return {
    week,
    trimester: trimesterFromWeeks(week),
    changed: week > params.gestationalWeek,
  };
}
