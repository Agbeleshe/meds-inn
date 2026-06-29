/** Trimester label from gestational week (matches api/lib/mothers.ts). */
export function trimesterFromWeeks(weeks: number) {
  if (weeks <= 0) return "Enrolled";
  if (weeks <= 13) return "First";
  if (weeks <= 27) return "Second";
  return "Third";
}

/** Estimated due date assuming `weeks` gestational age on `referenceDate` (40-week pregnancy). */
export function eddFromGestationalWeek(weeks: number, referenceDate = new Date()) {
  if (weeks <= 0 || weeks > 42) return "";
  const daysRemaining = (40 - weeks) * 7;
  const edd = new Date(referenceDate);
  edd.setDate(edd.getDate() + daysRemaining);
  return edd.toISOString().slice(0, 10);
}
