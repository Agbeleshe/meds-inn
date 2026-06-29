import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "./lib/auth.js";
import { listMotherRecordsFast } from "./lib/mothers.js";
import { canAccessMother } from "./lib/access.js";
import {
  getAppointmentById,
  normalizeAppointment,
  putAppointmentRecord,
} from "./lib/appointment-records";
import {
  getVideoSessionRecord,
  putVideoSessionRecord,
} from "./lib/video-session-records";
import { logActivity } from "./lib/activity-log.js";
import { json, methodNotAllowed, readBody } from "./lib/handler.js";

function structureTranscript(transcript: string): string {
  const lines = transcript
    .split(/[\n.]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length === 0) return "";

  const advice = lines.filter((l) =>
    /take|avoid|rest|drink|medication|dose|follow|come back|call|prescribe|recommend|should|need to/i.test(l),
  );
  const concerns = lines.filter((l) =>
    /feel|pain|symptom|worry|concern|dizzy|tired|nausea|bleeding/i.test(l),
  );
  const other = lines.filter((l) => !advice.includes(l) && !concerns.includes(l));

  const parts: string[] = ["Visit discussion summary", ""];
  if (advice.length) {
    parts.push("What your specialist said:");
    advice.forEach((l) => parts.push(`• ${l}`));
    parts.push("");
  }
  if (concerns.length) {
    parts.push("What you discussed:");
    concerns.forEach((l) => parts.push(`• ${l}`));
    parts.push("");
  }
  if (other.length) {
    parts.push("Other notes:");
    other.forEach((l) => parts.push(`• ${l}`));
  }
  return parts.join("\n").trim();
}

async function canAccessAppointment(
  user: Record<string, unknown>,
  appointment: ReturnType<typeof normalizeAppointment>,
  mother: Record<string, unknown>,
) {
  const role = String(user.role);
  if (role === "mother" && String(user.motherId) === appointment.patientId) return true;
  if (["admin", "nurse", "doctor"].includes(role) && canAccessMother(user, mother)) return true;
  return false;
}

/** GET/POST /api/video-sessions — visit transcripts & session completion */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const hospitalId = String(user.hospitalId ?? "ELR");
  const appointmentId =
    typeof req.query.appointmentId === "string" ? req.query.appointmentId.trim() : "";

  if (req.method === "GET") {
    if (!appointmentId) return json(res, 400, { error: "appointmentId is required" });

    const appointment = await getAppointmentById(appointmentId);
    if (!appointment || appointment.hospitalId !== hospitalId) {
      return json(res, 404, { error: "Appointment not found" });
    }

    const mothers = await listMotherRecordsFast(hospitalId);
    const mother = mothers.find((m) => String(m.id) === appointment.patientId);
    if (!mother || !(await canAccessAppointment(user, appointment, mother))) {
      return json(res, 403, { error: "Access denied" });
    }

    const item = await getVideoSessionRecord(appointmentId, appointment.patientId);
    return json(res, 200, { item, appointment, source: item ? "dynamodb" : "demo" });
  }

  if (req.method === "POST") {
    try {
      const body = await readBody<{
        appointmentId: string;
        transcript?: string;
        complete?: boolean;
      }>(req);

      const aptId = String(body?.appointmentId ?? appointmentId).trim();
      if (!aptId) return json(res, 400, { error: "appointmentId is required" });

      const appointment = await getAppointmentById(aptId);
      if (!appointment || appointment.hospitalId !== hospitalId) {
        return json(res, 404, { error: "Appointment not found" });
      }

      const mothers = await listMotherRecordsFast(hospitalId);
      const mother = mothers.find((m) => String(m.id) === appointment.patientId);
      if (!mother || !(await canAccessAppointment(user, appointment, mother))) {
        return json(res, 403, { error: "Access denied" });
      }

      const transcript = String(body?.transcript ?? "").trim();
      const structuredNotes = structureTranscript(transcript);
      const now = new Date().toISOString();

      const session = await putVideoSessionRecord(
        {
          id: aptId,
          appointmentId: aptId,
          patientId: appointment.patientId,
          transcript,
          structuredNotes,
          clinicianName: appointment.clinician,
          appointmentType: appointment.type,
          hospitalId,
          recordedByUserId: String(user.id),
          recordedByName: String(user.name),
          createdAt: now,
          completedAt: now,
        },
        appointment.patientId,
      );

      let savedAppointment = appointment;
      if (body?.complete !== false && appointment.status === "scheduled") {
        savedAppointment = await putAppointmentRecord({
          ...appointment,
          status: "completed",
          completedAt: now,
        });
      }

      void logActivity({
        hospitalId,
        category: "video-call",
        action: "Video session completed",
        detail: `${appointment.patient} — ${appointment.type}`,
        actorName: String(user.name),
        actorUserId: String(user.id),
        actorRole: String(user.role),
        patientId: appointment.patientId,
        patientName: appointment.patient,
        appointmentId: aptId,
      });

      return json(res, 201, {
        item: session,
        appointment: savedAppointment,
        source: "dynamodb",
      });
    } catch (error) {
      console.error("Video session POST failed:", error);
      return json(res, 500, { error: "Failed to save session notes" });
    }
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}
