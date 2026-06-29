import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DEMO_USERS } from "../../src/lib/demo-users.js";
import { dynamodb, TABLE_NAME } from "./dynamodb.js";
import { createNotification } from "./notifications.js";
import { resolveMotherUserId } from "./fast-fallback.js";
import { logActivity } from "./activity-log.js";

function formatTimeDisplay(time: string) {
  const raw = time.trim();
  if (/AM|PM/i.test(raw)) return raw;
  const [h, m] = raw.split(":").map(Number);
  if (Number.isNaN(h)) return raw;
  const meridiem = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m ?? 0).padStart(2, "0")} ${meridiem}`;
}

function formatDateDisplay(date: string) {
  try {
    const d = new Date(`${date}T12:00:00`);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

function formatWhen(date: string, time: string) {
  return `${formatDateDisplay(date)} at ${formatTimeDisplay(time)}`;
}

export function buildVideoRoomId(appointmentId: string) {
  return `medsinn-${appointmentId.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase()}`;
}

export async function findMotherUserId(patientId: string): Promise<string | null> {
  const fast = resolveMotherUserId(patientId);
  if (fast) return fast;

  const demo = DEMO_USERS.find(
    (u) => u.role === "mother" && u.motherId === patientId,
  );
  if (demo) return demo.id;

  try {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "entityType = :entityType AND motherId = :motherId AND #role = :role",
        ExpressionAttributeNames: { "#role": "role" },
        ExpressionAttributeValues: {
          ":entityType": "USER",
          ":motherId": patientId,
          ":role": "mother",
        },
        Limit: 5,
      }),
    );
    const id = result.Items?.[0]?.id;
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

async function notifyClinicianPrep(input: {
  userId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  type: string;
  date: string;
  time: string;
  mode: string;
  isVideo: boolean;
}) {
  const when = formatWhen(input.date, input.time);
  const kind = input.isVideo ? "Video consultation" : "Appointment";
  await createNotification({
    userId: input.userId,
    type: "appointment",
    title: `${kind} to prepare for`,
    body: `${input.patientName} — ${input.type} on ${when}. Review the patient profile and AI brief before the visit.`,
    motherId: input.patientId,
    appointmentId: input.appointmentId,
  }).catch((err) => console.warn("Clinician prep notification failed:", err));
}

export async function notifyMotherAppointmentScheduled(input: {
  appointmentId: string;
  patientId: string;
  patientName: string;
  type: string;
  date: string;
  time: string;
  clinician: string;
  location: string;
  mode?: string;
  videoRoomId?: string;
  createdByUserId?: string;
  assignedDoctorUserId?: string | null;
  assignedNurseUserId?: string | null;
  hospitalId?: string;
  actorName?: string;
  actorRole?: string;
}) {
  const userId = await findMotherUserId(input.patientId);
  const when = formatWhen(input.date, input.time);
  const isVideo = input.mode === "virtual" || input.mode === "video";

  if (userId) {
    const body = isVideo
      ? `Your video consultation with ${input.clinician} is scheduled for ${when}. You will receive a reminder before the call. Tap to join when it's time.`
      : `Your ${input.type} with ${input.clinician} is scheduled for ${when} at ${input.location || "the clinic"}. Tap to view your appointment.`;

    await createNotification({
      userId,
      type: "appointment",
      title: isVideo ? "Video consultation scheduled" : "Appointment scheduled",
      body,
      motherId: input.patientId,
      appointmentId: input.appointmentId,
    }).catch((err) => console.warn("Appointment scheduled notification failed:", err));
  }

  const clinicianIds = new Set<string>();
  if (input.createdByUserId) clinicianIds.add(input.createdByUserId);
  if (input.assignedDoctorUserId) clinicianIds.add(String(input.assignedDoctorUserId));
  if (input.assignedNurseUserId) clinicianIds.add(String(input.assignedNurseUserId));

  for (const clinicianId of clinicianIds) {
    if (clinicianId === userId) continue;
    await notifyClinicianPrep({
      userId: clinicianId,
      appointmentId: input.appointmentId,
      patientId: input.patientId,
      patientName: input.patientName,
      type: input.type,
      date: input.date,
      time: input.time,
      mode: input.mode ?? "in-person",
      isVideo,
    });
  }

  void logActivity({
    hospitalId: input.hospitalId ?? "ELR",
    category: isVideo ? "video-call" : "appointment",
    action: isVideo ? "Video appointment booked" : "Appointment booked",
    detail: `${input.patientName} — ${input.type} on ${when}${isVideo ? " (video)" : ""}`,
    actorName: input.actorName ?? input.clinician,
    actorUserId: input.createdByUserId ?? "",
    actorRole: input.actorRole ?? "doctor",
    patientId: input.patientId,
    patientName: input.patientName,
    appointmentId: input.appointmentId,
  });
}

export async function notifyMotherAppointmentRescheduled(input: {
  appointmentId: string;
  patientId: string;
  type: string;
  previousDate: string;
  previousTime: string;
  date: string;
  time: string;
  clinician: string;
  mode?: string;
  createdByUserId?: string;
  assignedDoctorUserId?: string | null;
  patientName?: string;
  hospitalId?: string;
  actorName?: string;
}) {
  const userId = await findMotherUserId(input.patientId);
  const from = formatWhen(input.previousDate, input.previousTime);
  const to = formatWhen(input.date, input.time);
  const isVideo = input.mode === "virtual" || input.mode === "video";

  if (userId) {
    await createNotification({
      userId,
      type: "appointment",
      title: isVideo ? "Video consultation rescheduled" : "Appointment rescheduled",
      body: `Your ${input.type} with ${input.clinician} has been moved to ${to} (was ${from}). Tap to view your updated appointment.`,
      motherId: input.patientId,
      appointmentId: input.appointmentId,
    }).catch((err) => console.warn("Appointment reschedule notification failed:", err));
  }

  if (input.createdByUserId) {
    await notifyClinicianPrep({
      userId: input.createdByUserId,
      appointmentId: input.appointmentId,
      patientId: input.patientId,
      patientName: input.patientName ?? "Patient",
      type: input.type,
      date: input.date,
      time: input.time,
      mode: input.mode ?? "in-person",
      isVideo,
    });
  }

  void logActivity({
    hospitalId: input.hospitalId ?? "ELR",
    category: input.mode === "virtual" || input.mode === "video" ? "video-call" : "appointment",
    action: "Appointment rescheduled",
    detail: `${input.patientName ?? input.patientId} moved to ${to}`,
    actorName: input.actorName ?? input.clinician,
    actorUserId: input.createdByUserId ?? "",
    actorRole: "doctor",
    patientId: input.patientId,
    patientName: input.patientName,
    appointmentId: input.appointmentId,
  });
}

export async function notifyAppointmentReminder(input: {
  appointmentId: string;
  patientId: string;
  patientName: string;
  type: string;
  date: string;
  time: string;
  clinician: string;
  mode?: string;
  motherUserId?: string | null;
  clinicianUserIds?: string[];
  hospitalId?: string;
}) {
  const when = formatWhen(input.date, input.time);
  const isVideo = input.mode === "virtual" || input.mode === "video";
  const title = isVideo ? "Video call reminder" : "Appointment reminder";
  const body = isVideo
    ? `Your video consultation with ${input.clinician} is ${when}. Tap to join the call when ready.`
    : `Reminder: ${input.type} with ${input.clinician} on ${when}.`;

  if (input.motherUserId) {
    await createNotification({
      userId: input.motherUserId,
      type: "appointment",
      title,
      body,
      motherId: input.patientId,
      appointmentId: input.appointmentId,
    }).catch((err) => console.warn("Mother reminder failed:", err));
  }

  for (const userId of input.clinicianUserIds ?? []) {
    await createNotification({
      userId,
      type: "appointment",
      title: isVideo ? "Video call starting soon" : "Upcoming appointment",
      body: `${input.patientName} — ${input.type} ${when}. Prepare using the patient AI brief.`,
      motherId: input.patientId,
      appointmentId: input.appointmentId,
    }).catch((err) => console.warn("Clinician reminder failed:", err));
  }

  void logActivity({
    hospitalId: input.hospitalId ?? "ELR",
    category: isVideo ? "video-call" : "appointment",
    action: "Reminder sent",
    detail: `${input.patientName} — ${when}`,
    actorName: "System",
    actorUserId: "system",
    actorRole: "system",
    patientId: input.patientId,
    patientName: input.patientName,
    appointmentId: input.appointmentId,
  });
}
