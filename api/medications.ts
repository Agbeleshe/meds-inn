import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "./lib/auth";
import { listMotherRecordsFast } from "./lib/mothers";
import { filterMedicationsForRole, canEditMedication, canPrescribeMedicationForPatient } from "../src/lib/assignments";
import {
  listMedicationRecords,
  putMedicationRecord,
  getMedicationRecordById,
  normalizeMedication,
  defaultScheduleTimes,
} from "./lib/medication-records";
import { withTimeout } from "./lib/fast-fallback";
import { MEDICATIONS } from "../src/lib/demo-data";
import { json, methodNotAllowed, readBody } from "./lib/handler";

/** GET/POST/PATCH /api/medications — role-scoped medication prescriptions */
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
      let items = await withTimeout(
        listMedicationRecords(hospitalId),
        2500,
        MEDICATIONS.map((m) => normalizeMedication(m as unknown as Record<string, unknown>)).filter(
          (m) => !hospitalId || m.hospitalId === hospitalId,
        ),
      );
      items = filterMedicationsForRole(items, {
        id: String(user.id),
        role: user.role as "admin" | "nurse" | "doctor" | "mother",
        motherId: user.motherId as string | undefined,
        hospitalId,
      });

      if (patientIdQuery && user.role !== "mother") {
        if (user.role !== "admin") {
          const mothers = await listMotherRecordsFast(hospitalId);
          const mother = mothers.find((m) => String(m.id) === patientIdQuery);
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
            return json(res, 403, { error: "You can only view medications for mothers assigned to you" });
          }
        }
        items = items.filter((m) => m.patientId === patientIdQuery);
      }

      const enriched = items.map((med) => ({
        ...med,
        canEdit: canEditMedication(
          { id: String(user.id), role: user.role as "admin" | "nurse" | "doctor" | "mother" },
          med,
        ),
      }));

      return json(res, 200, { items: enriched, source: "dynamodb" });
    } catch (error) {
      console.error("Medications GET failed:", error);
      return json(res, 500, { error: "Failed to load medications" });
    }
  }

  if (req.method === "POST") {
    if (user.role === "mother") {
      return json(res, 403, { error: "Mothers cannot prescribe medications" });
    }

    try {
      const body = await readBody<Record<string, unknown>>(req);
      const patientId = String(body?.patientId ?? "").trim();
      if (!patientId) return json(res, 400, { error: "patientId is required" });

      const mothers = await listMotherRecordsFast(hospitalId);
      const mother = mothers.find((m) => String(m.id) === patientId);
      if (!mother) return json(res, 404, { error: "Patient not found" });

      if (!canPrescribeMedicationForPatient(
        { id: String(user.id), role: user.role as "admin" | "nurse" | "doctor" | "mother", name: String(user.name) },
        {
          assignedNurseUserId: mother.assignedNurseUserId as string | null,
          assignedDoctorUserId: mother.assignedDoctorUserId as string | null,
          nurse: String(mother.nurse ?? ""),
          doctor: String(mother.doctor ?? ""),
        },
      )) {
        return json(res, 403, { error: "You can only prescribe for mothers assigned to you" });
      }

      const id = `med-${Date.now()}`;
      const frequency = String(body?.frequency ?? "Once daily");
      const record = normalizeMedication({
        ...body,
        id,
        hospitalId,
        prescribedBy: String(body?.prescribedBy ?? user.name),
        prescribedByUserId: String(body?.prescribedByUserId ?? user.id),
        scheduleTimes: body?.scheduleTimes ?? defaultScheduleTimes(frequency),
        adherence: 100,
        missedDoses: 0,
        lastTaken: "",
        active: true,
      });

      try {
        await putMedicationRecord(record);
      } catch (dbErr) {
        console.warn("Medication put failed:", dbErr);
      }

      return json(res, 201, {
        item: { ...record, canEdit: true },
        source: "dynamodb",
      });
    } catch (error) {
      console.error("Medications POST failed:", error);
      return json(res, 500, { error: "Failed to create medication" });
    }
  }

  if (req.method === "PATCH") {
    if (user.role === "mother") {
      return json(res, 403, { error: "Mothers cannot edit prescriptions" });
    }

    try {
      const body = await readBody<Record<string, unknown>>(req);
      const id = String(body?.id ?? "");
      if (!id) return json(res, 400, { error: "Medication id is required" });

      const existing = await getMedicationRecordById(id);
      if (!existing) return json(res, 404, { error: "Medication not found" });

      if (!canEditMedication(
        { id: String(user.id), role: user.role as "admin" | "nurse" | "doctor" | "mother" },
        existing,
      )) {
        return json(res, 403, { error: "Only the prescribing specialist or admin can edit this medication" });
      }

      const updated = normalizeMedication({ ...existing, ...body, id });
      try {
        await putMedicationRecord(updated);
      } catch (dbErr) {
        console.warn("Medication patch put failed:", dbErr);
      }

      const doses = await listDoseRecords(updated.patientId);
      const stats = computeAdherenceStats(updated, doses);

      return json(res, 200, {
        item: { ...updated, ...stats, canEdit: true },
        source: "dynamodb",
      });
    } catch (error) {
      console.error("Medications PATCH failed:", error);
      return json(res, 500, { error: "Failed to update medication" });
    }
  }

  return methodNotAllowed(res, ["GET", "POST", "PATCH"]);
}
