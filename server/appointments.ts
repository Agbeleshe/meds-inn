import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "./lib/auth.js";
import { listMotherRecordsFast, putMotherRecordResolved } from "./lib/mothers.js";
import { canAccessMother } from "./lib/access.js";
import { filterAppointmentsForRole } from "../src/lib/assignments.js";
import { sortAppointmentsByRecent } from "../src/lib/appointment-sort.js";
import {
  applyMissedStatus,
  listAppointmentRecords,
  normalizeAppointment,
  putAppointmentRecord,
} from "./lib/appointment-records";
import {
  notifyMotherAppointmentScheduled,
  buildVideoRoomId,
} from "./lib/appointment-notify";
import { processAppointmentReminders } from "./lib/appointment-reminders.js";
import { json, methodNotAllowed, readBody } from "./lib/handler.js";

/** GET/POST /api/appointments — role-scoped list and specialist booking */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const hospitalId = String(user.hospitalId ?? "ELR");
  const patientIdQuery =
    typeof req.query.patientId === "string" ? req.query.patientId.trim() : undefined;

  if (req.method === "GET") {
    try {
      let items = await listAppointmentRecords(hospitalId);
      items = applyMissedStatus(items);

      const mothers = await listMotherRecordsFast(hospitalId);

      items = filterAppointmentsForRole(
        items as unknown as Record<string, unknown>[],
        {
          id: String(user.id),
          role: user.role as "admin" | "nurse" | "doctor" | "mother",
          motherId: user.motherId as string | undefined,
          name: String(user.name),
        },
        mothers.map((m) => ({
          id: String(m.id),
          assignedNurseUserId: m.assignedNurseUserId as string | null,
          assignedDoctorUserId: m.assignedDoctorUserId as string | null,
        })),
      ) as typeof items;

      if (patientIdQuery && user.role !== "mother") {
        items = items.filter((a) => a.patientId === patientIdQuery);
      }

      items = sortAppointmentsByRecent(items);

      void processAppointmentReminders(items, mothers).catch((err) =>
        console.warn("Appointment reminders failed:", err),
      );

      return json(res, 200, { items, source: "dynamodb" });
    } catch (error) {
      console.error("Appointments GET failed:", error);
      return json(res, 200, { items: [], source: "demo" });
    }
  }

  if (req.method === "POST") {
    if (user.role === "mother") {
      return json(res, 403, { error: "Mothers cannot create appointments" });
    }

    try {
      const body = await readBody<Record<string, unknown>>(req);
      const patientId = String(body?.patientId ?? "").trim();
      const date = String(body?.date ?? "").trim();
      const time = String(body?.time ?? "").trim();
      const type = String(body?.type ?? "Check-up").trim();
      const reason = String(body?.reason ?? "").trim();

      if (!patientId || !date || !time) {
        return json(res, 400, { error: "patientId, date, and time are required" });
      }

      const mothers = await listMotherRecordsFast(hospitalId);
      const mother = mothers.find((m) => String(m.id) === patientId);
      if (!mother) return json(res, 404, { error: "Patient not found" });

      if (!canAccessMother(user, mother)) {
        return json(res, 403, { error: "You can only book for mothers assigned to you" });
      }

      const mode = String(body?.mode ?? "in-person");
      const isVideo = mode === "virtual" || mode === "video";
      const id = `apt-${Date.now()}`;
      const createdAt = new Date().toISOString();
      const record = normalizeAppointment({
        id,
        patientId,
        patient: String(mother.name ?? body?.patient ?? "Patient"),
        type,
        clinician: String(body?.clinician ?? user.name),
        date,
        time,
        mode: isVideo ? "virtual" : mode,
        status: "scheduled",
        reason: reason || type,
        duration: Number(body?.duration ?? 30),
        location: isVideo ? "Video call" : String(body?.location ?? "Clinic"),
        hospitalId,
        createdAt,
        createdByUserId: String(user.id),
        videoRoomId: isVideo ? buildVideoRoomId(id) : undefined,
      });

      const saved = await putAppointmentRecord(record);

      if (isVideo && String(mother.videoCallRequestStatus ?? "") === "pending") {
        void putMotherRecordResolved({
          ...mother,
          id: patientId,
          videoCallRequestStatus: "scheduled",
        }).catch((err) => console.warn("Clear video request failed:", err));
      }

      void notifyMotherAppointmentScheduled({
        appointmentId: saved.id,
        patientId: saved.patientId,
        patientName: saved.patient,
        type: saved.type,
        date: saved.date,
        time: saved.time,
        clinician: saved.clinician,
        location: saved.location,
        mode: saved.mode,
        videoRoomId: saved.videoRoomId,
        createdByUserId: String(user.id),
        assignedDoctorUserId: mother.assignedDoctorUserId as string | null,
        assignedNurseUserId: mother.assignedNurseUserId as string | null,
        hospitalId,
        actorName: String(user.name),
        actorRole: String(user.role),
      });

      return json(res, 201, { item: saved, source: "dynamodb" });
    } catch (error) {
      console.error("Appointments POST failed:", error);
      return json(res, 500, { error: "Failed to create appointment" });
    }
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}
