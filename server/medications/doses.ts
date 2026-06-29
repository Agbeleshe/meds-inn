import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "../lib/auth.js";
import { listMotherRecordsFast } from "../lib/mothers.js";
import { filterMedicationsForRole, canPrescribeMedicationForPatient } from "../../src/lib/assignments.js";
import {
  listMedicationRecords,
  listDoseRecords,
  putDoseRecord,
  putMedicationRecord,
  buildTodayDoses,
  buildDoseHistory,
  computeAdherenceStats,
  getMedicationRecordById,
} from "../lib/medication-records";
import { createNotification } from "../lib/notifications.js";
import { json, methodNotAllowed, readBody } from "../lib/handler.js";

/** GET/POST /api/medications/doses — today's doses & dose history */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const hospitalId = String(user.hospitalId ?? "ELR");
  const patientId =
    typeof req.query.patientId === "string"
      ? req.query.patientId.trim()
      : user.role === "mother"
        ? String(user.motherId ?? "")
        : "";

  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;
  const today = new Date().toISOString().slice(0, 10);

  if (req.method === "GET") {
    if (!patientId) return json(res, 400, { error: "patientId is required" });

    if (user.role === "mother" && patientId !== user.motherId) {
      return json(res, 403, { error: "Access denied" });
    }

    if (user.role !== "mother" && user.role !== "admin") {
      const mothers = await listMotherRecordsFast(hospitalId);
      const mother = mothers.find((m) => String(m.id) === patientId);
      if (
        !mother ||
        !canPrescribeMedicationForPatient(
          { id: String(user.id), role: user.role as "admin" | "nurse" | "doctor" | "mother", name: String(user.name) },
          {
            assignedNurseUserId: mother.assignedNurseUserId as string | null,
            assignedDoctorUserId: mother.assignedDoctorUserId as string | null,
            nurse: String(mother.nurse ?? ""),
            doctor: String(mother.doctor ?? ""),
          },
        )
      ) {
        return json(res, 403, { error: "You can only view doses for mothers assigned to you" });
      }
    }

    try {
      let medications = await listMedicationRecords(hospitalId);
      medications = filterMedicationsForRole(medications, {
        id: String(user.id),
        role: user.role as "admin" | "nurse" | "doctor" | "mother",
        motherId: user.motherId as string | undefined,
        hospitalId,
      }).filter((m) => m.patientId === patientId);

      const storedDoses = await listDoseRecords(patientId, from, to);

      if (from && to) {
        const history = buildDoseHistory(medications, storedDoses, from, to, today);
        return json(res, 200, { items: history, source: "dynamodb" });
      }

      const todayDoses = buildTodayDoses(medications, storedDoses, today);
      return json(res, 200, { items: todayDoses, source: "dynamodb" });
    } catch (error) {
      console.error("Doses GET failed:", error);
      return json(res, 500, { error: "Failed to load doses" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = await readBody<{
        doseId: string;
        medicationId: string;
        patientId: string;
        date: string;
        scheduledTime: string;
        status: "taken" | "skipped";
      }>(req);

      if (!body?.doseId || !body.medicationId || !body.patientId) {
        return json(res, 400, { error: "doseId, medicationId, and patientId are required" });
      }

      if (user.role === "mother" && body.patientId !== user.motherId) {
        return json(res, 403, { error: "Access denied" });
      }

      if (user.role !== "mother" && user.role !== "admin") {
        const med = await getMedicationRecordById(body.medicationId);
        if (!med || med.prescribedByUserId !== user.id) {
          return json(res, 403, { error: "Access denied" });
        }
      }

      const mothers = await listMotherRecordsFast(hospitalId);
      const mother = mothers.find((m) => String(m.id) === body.patientId);

      const dose = {
        id: body.doseId,
        medicationId: body.medicationId,
        patientId: body.patientId,
        date: body.date,
        scheduledTime: body.scheduledTime,
        status: body.status,
        recordedAt: new Date().toISOString(),
        recordedBy: String(user.name),
      };

      try {
        await putDoseRecord(dose, body.patientId);
      } catch (dbErr) {
        console.warn("Dose put failed:", dbErr);
      }

      const med = await getMedicationRecordById(body.medicationId);
      if (med) {
        const allDoses = await listDoseRecords(body.patientId);
        const stats = computeAdherenceStats(med, [...allDoses, dose]);
        try {
          await putMedicationRecord({ ...med, ...stats });
        } catch (dbErr) {
          console.warn("Medication stats update failed:", dbErr);
        }
      }

      if (body.status === "skipped" && mother?.assignedNurseUserId) {
        try {
          await createNotification({
            userId: String(mother.assignedNurseUserId),
            type: "medication",
            title: "Medication skipped",
            body: `${mother.name ?? "A mother"} skipped a scheduled dose.`,
            motherId: body.patientId,
          });
        } catch (notifyErr) {
          console.warn("Skip notification failed:", notifyErr);
        }
      }

      return json(res, 200, { item: dose, source: "dynamodb" });
    } catch (error) {
      console.error("Doses POST failed:", error);
      return json(res, 500, { error: "Failed to record dose" });
    }
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}
