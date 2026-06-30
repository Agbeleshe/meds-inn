import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "../lib/auth.js";
import { listMotherRecordsFast } from "../lib/mothers.js";
import { canAccessMother } from "../lib/access.js";
import {
  getAppointmentById,
  normalizeAppointment,
  putAppointmentRecord,
  todayDateString,
} from "../lib/appointment-records.js";
import { notifyMotherAppointmentRescheduled } from "../lib/appointment-notify.js";
import { json, methodNotAllowed, readBody } from "../lib/handler.js";

function isInPerson(mode: string) {
  return mode !== "virtual" && mode !== "video";
}

/** PATCH /api/appointments/:id — reschedule, mark attended, or confirm attendance */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PATCH") return methodNotAllowed(res, ["PATCH"]);

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const role = String(user.role);
  const id = String(req.query.id ?? "").trim();
  if (!id) return json(res, 400, { error: "Appointment id is required" });

  const hospitalId = String(user.hospitalId ?? "ELR");

  try {
    const existing = await getAppointmentById(id);
    if (!existing || existing.hospitalId !== hospitalId) {
      return json(res, 404, { error: "Appointment not found" });
    }

    const mothers = await listMotherRecordsFast(hospitalId);
    const mother = mothers.find((m) => String(m.id) === existing.patientId);
    if (!mother) return json(res, 404, { error: "Patient not found" });

    const body = await readBody<Record<string, unknown>>(req);
    const action = String(body?.action ?? "").trim();

    // ── Mother marks in-person attendance ──────────────────────────────────
    if (action === "mark_attended") {
      if (role !== "mother" || String(user.motherId) !== existing.patientId) {
        return json(res, 403, { error: "Only the patient can mark attendance" });
      }
      if (!isInPerson(existing.mode)) {
        return json(res, 400, { error: "Only in-person appointments can be marked attended" });
      }
      if (existing.date > todayDateString()) {
        return json(res, 400, { error: "Cannot mark attendance before the appointment date" });
      }
      if (existing.status === "completed" || existing.status === "cancelled") {
        return json(res, 400, { error: "This appointment is already closed" });
      }

      const updated = normalizeAppointment({
        ...existing,
        motherMarkedAttended: true,
        motherMarkedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const saved = await putAppointmentRecord(updated);
      return json(res, 200, { item: saved, source: "dynamodb" });
    }

    // ── Clinician confirms attendance + optional note ──────────────────────
    if (action === "confirm_attendance") {
      if (role === "mother") {
        return json(res, 403, { error: "Mothers cannot confirm clinical attendance" });
      }
      if (role !== "admin" && !canAccessMother(user, mother)) {
        return json(res, 403, { error: "You can only confirm attendance for assigned mothers" });
      }
      if (!isInPerson(existing.mode)) {
        return json(res, 400, { error: "Only in-person appointments use attendance confirmation" });
      }

      const attendanceNote = body?.attendanceNote != null ? String(body.attendanceNote).trim() : "";
      const updated = normalizeAppointment({
        ...existing,
        clinicianConfirmed: true,
        clinicianConfirmedAt: new Date().toISOString(),
        confirmedBy: String(user.name),
        attendanceNote,
        status: "completed",
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const saved = await putAppointmentRecord(updated);
      return json(res, 200, { item: saved, source: "dynamodb" });
    }

    // ── Reschedule (staff only) ────────────────────────────────────────────
    if (role === "mother") {
      return json(res, 403, { error: "Mothers cannot reschedule appointments" });
    }
    if (role !== "admin" && !canAccessMother(user, mother)) {
      return json(res, 403, { error: "You can only reschedule for mothers assigned to you" });
    }

    const date = String(body?.date ?? existing.date).trim();
    const time = String(body?.time ?? existing.time).trim();

    if (!date || !time) {
      return json(res, 400, { error: "date and time are required" });
    }

    const dateChanged = date !== existing.date || time !== existing.time;
    const updated = normalizeAppointment({
      ...existing,
      date,
      time,
      status:
        dateChanged && (existing.status === "missed" || existing.status === "scheduled")
          ? "scheduled"
          : existing.status,
      rescheduled: dateChanged ? true : existing.rescheduled === true,
      rescheduledAt: dateChanged ? new Date().toISOString() : existing.rescheduledAt,
      updatedAt: new Date().toISOString(),
    });

    const saved = await putAppointmentRecord(updated);

    if (dateChanged) {
      void notifyMotherAppointmentRescheduled({
        appointmentId: saved.id,
        patientId: saved.patientId,
        patientName: saved.patient,
        type: saved.type,
        previousDate: existing.date,
        previousTime: existing.time,
        date: saved.date,
        time: saved.time,
        clinician: saved.clinician,
        mode: saved.mode,
        createdByUserId: saved.createdByUserId,
        hospitalId,
        actorName: String(user.name),
      });
    }

    return json(res, 200, { item: saved, source: "dynamodb" });
  } catch (error) {
    console.error("Appointment PATCH failed:", error);
    return json(res, 500, { error: "Failed to update appointment" });
  }
}
