import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import {
  dynamodb,
  TABLE_NAME,
  stripKeys,
} from "./dynamodb.js";
import { prefixFilter, toAppointmentItem } from "./items.js";
import { withTimeout } from "./fast-fallback.js";
import { APPOINTMENTS } from "../../src/lib/demo-data.js";
import {
  listAppointmentSessions,
  saveAppointmentSession,
} from "./appointment-session-store.js";

export function normalizeAppointment(raw: Record<string, unknown>) {
  return {
    id: String(raw.id ?? ""),
    patientId: String(raw.patientId ?? ""),
    patient: String(raw.patient ?? ""),
    type: String(raw.type ?? "Check-up"),
    clinician: String(raw.clinician ?? ""),
    date: String(raw.date ?? ""),
    time: String(raw.time ?? ""),
    mode: String(raw.mode ?? "in-person"),
    status: String(raw.status ?? "scheduled") as
      | "scheduled"
      | "completed"
      | "missed"
      | "cancelled",
    reason: String(raw.reason ?? ""),
    duration: Number(raw.duration ?? 30),
    location: String(raw.location ?? ""),
    hospitalId: String(raw.hospitalId ?? "ELR"),
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    createdByUserId: raw.createdByUserId ? String(raw.createdByUserId) : undefined,
    rescheduled: raw.rescheduled === true,
    rescheduledAt: raw.rescheduledAt ? String(raw.rescheduledAt) : undefined,
    videoRoomId: raw.videoRoomId ? String(raw.videoRoomId) : undefined,
    reminderSent: raw.reminderSent === true,
    completedAt: raw.completedAt ? String(raw.completedAt) : undefined,
    motherMarkedAttended: raw.motherMarkedAttended === true,
    motherMarkedAt: raw.motherMarkedAt ? String(raw.motherMarkedAt) : undefined,
    clinicianConfirmed: raw.clinicianConfirmed === true,
    clinicianConfirmedAt: raw.clinicianConfirmedAt ? String(raw.clinicianConfirmedAt) : undefined,
    confirmedBy: raw.confirmedBy ? String(raw.confirmedBy) : undefined,
    attendanceNote: raw.attendanceNote ? String(raw.attendanceNote) : undefined,
  };
}

export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function demoAppointments(hospitalId: string) {
  return APPOINTMENTS.filter((a) => ((a as unknown as { hospitalId?: string }).hospitalId ?? "ELR") === hospitalId).map((a) =>
    normalizeAppointment(a as unknown as Record<string, unknown>),
  );
}

export async function listAppointmentRecordsFromDb(hospitalId: string) {
  const result = await withTimeout(
    dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        Limit: 500,
        ...prefixFilter("APPOINTMENT#"),
      }),
    ),
    2500,
    { Items: [] } as any,
  );

  return (result.Items ?? [])
    .map((item) => normalizeAppointment(stripKeys(item as Record<string, unknown>)))
    .filter((a) => a.hospitalId === hospitalId);
}

/** DB + session + demo fallback — same pattern as mothers/medications. */
export async function listAppointmentRecords(hospitalId: string) {
  const byId = new Map<string, ReturnType<typeof normalizeAppointment>>();

  try {
    const fromDb = await listAppointmentRecordsFromDb(hospitalId);
    for (const a of fromDb) byId.set(a.id, a);
  } catch (error) {
    console.warn("DynamoDB listAppointmentRecords failed:", error);
  }

  if (byId.size === 0) {
    for (const a of demoAppointments(hospitalId)) byId.set(a.id, a);
  }

  for (const session of listAppointmentSessions(hospitalId)) {
    const normalized = normalizeAppointment(session);
    byId.set(normalized.id, normalized);
  }

  return Array.from(byId.values());
}

export async function getAppointmentById(id: string) {
  const session = listAppointmentSessions().find((a) => String(a.id) === id);
  if (session) return normalizeAppointment(session);

  try {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `APPOINTMENT#${id}`, SK: "METADATA" },
      }),
    );
    if (result.Item) {
      return normalizeAppointment(stripKeys(result.Item as Record<string, unknown>));
    }
  } catch (error) {
    console.warn("DynamoDB getAppointmentById failed:", error);
  }

  const demo = APPOINTMENTS.find((a) => a.id === id);
  return demo ? normalizeAppointment(demo as unknown as Record<string, unknown>) : null;
}

export async function putAppointmentRecord(record: Record<string, unknown>) {
  const normalized = normalizeAppointment(record);
  saveAppointmentSession(normalized as unknown as Record<string, unknown>);

  try {
    await dynamodb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: toAppointmentItem(normalized),
      }),
    );
  } catch (error) {
    console.warn("DynamoDB putAppointmentRecord failed, kept in session:", error);
  }

  return normalized;
}

/** Mark past scheduled appointments as missed in memory; persist writes in background. */
export function applyMissedStatus(
  appointments: ReturnType<typeof normalizeAppointment>[],
) {
  const today = todayDateString();

  return appointments.map((apt) => {
    if (apt.status !== "scheduled" || apt.date >= today) return apt;
    const missed = { ...apt, status: "missed" as const };
    void putAppointmentRecord(missed).catch((err) => {
      console.error("Failed to persist missed appointment:", apt.id, err);
    });
    return missed;
  });
}
