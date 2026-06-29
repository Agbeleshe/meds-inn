import { createNotification } from "./notifications.js";
import { findMotherUserId } from "./appointment-notify.js";

export async function notifyMotherCarePlanAssigned(input: {
  patientId: string;
  clinicianName: string;
  itemCount: number;
  durationDays: number;
  startDate: string;
  endDate: string;
}) {
  const userId = await findMotherUserId(input.patientId);
  if (!userId) return;

  await createNotification({
    userId,
    type: "care-plan",
    title: "New care plan assigned",
    body: `${input.clinicianName} assigned you a ${input.durationDays}-day daily care checklist (${input.itemCount} tasks). Active ${input.startDate} through ${input.endDate}. Tap to view today's tasks.`,
    motherId: input.patientId,
  }).catch((err) => console.warn("Care plan assignment notification failed:", err));
}
