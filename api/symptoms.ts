import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "./lib/auth";
import { listMotherRecordsFast, putMotherRecordResolved, getMotherRecordResolved } from "./lib/mothers";
import { canAccessMother } from "./lib/access";
import { listSymptomRecords, putSymptomRecord } from "./lib/symptom-records";
import { createNotification } from "./lib/notifications";
import { logActivity } from "./lib/activity-log";
import { json, methodNotAllowed, readBody } from "./lib/handler";

/** GET/POST /api/symptoms */
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

  if (req.method === "GET") {
    if (!patientId) return json(res, 400, { error: "patientId is required" });

    if (user.role === "mother" && patientId !== user.motherId) {
      return json(res, 403, { error: "Access denied" });
    }

    if (user.role !== "mother") {
      const mothers = await listMotherRecordsFast(hospitalId);
      const mother = mothers.find((m) => String(m.id) === patientId);
      if (!mother || !canAccessMother(user, mother)) {
        return json(res, 403, { error: "Access denied" });
      }
    }

    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;
    const items = await listSymptomRecords(patientId, from, to);
    return json(res, 200, { items, source: "dynamodb" });
  }

  if (req.method === "POST") {
    try {
      const body = await readBody<{
        patientId: string;
        symptom: string;
        severity?: "mild" | "moderate" | "severe";
        notes?: string;
        date?: string;
        updateConcerns?: boolean;
      }>(req);

      const pid = String(body?.patientId ?? patientId).trim();
      const symptom = String(body?.symptom ?? "").trim();
      if (!pid || !symptom) {
        return json(res, 400, { error: "patientId and symptom are required" });
      }

      if (user.role === "mother" && pid !== user.motherId) {
        return json(res, 403, { error: "Access denied" });
      }

      if (user.role !== "mother") {
        const mothers = await listMotherRecordsFast(hospitalId);
        const mother = mothers.find((m) => String(m.id) === pid);
        if (!mother || !canAccessMother(user, mother)) {
          return json(res, 403, { error: "Access denied" });
        }
      }

      const today = new Date().toISOString().slice(0, 10);
      const record = await putSymptomRecord(
        {
          id: `sym-${Date.now()}`,
          patientId: pid,
          date: body.date ?? today,
          symptom,
          severity: body.severity ?? "mild",
          notes: body.notes ?? "",
          hospitalId,
          recordedAt: new Date().toISOString(),
          recordedBy: String(user.name),
          recordedByUserId: String(user.id),
          recordedByRole: String(user.role),
        },
        pid,
      );

      if (body.updateConcerns !== false && user.role === "mother") {
        const existing = await getMotherRecordResolved(pid);
        if (existing) {
          const concerns = [...(existing.concerns ?? [])];
          if (!concerns.includes(symptom)) concerns.unshift(symptom);
          await putMotherRecordResolved({ ...existing, id: pid, concerns: concerns.slice(0, 8) });
        }
      }

      const mother = await getMotherRecordResolved(pid);
      if (record.severity === "severe") {
        const targets = [
          mother?.assignedNurseUserId ? String(mother.assignedNurseUserId) : null,
          mother?.assignedDoctorUserId ? String(mother.assignedDoctorUserId) : null,
        ].filter(Boolean) as string[];
        for (const userId of targets) {
          void createNotification({
            userId,
            type: "symptom",
            title: "Severe symptom logged",
            body: `${mother?.name ?? "A patient"} logged "${symptom}" as severe. Review the symptom log.`,
            motherId: pid,
          }).catch((err) => console.warn("Symptom notify failed:", err));
        }
      }

      void logActivity({
        hospitalId,
        category: "symptom",
        action: "Symptom logged",
        detail: `${symptom} (${record.severity})`,
        actorName: String(user.name),
        actorUserId: String(user.id),
        actorRole: String(user.role),
        patientId: pid,
        patientName: mother?.name ? String(mother.name) : undefined,
      });

      return json(res, 201, { item: record, source: "dynamodb" });
    } catch (error) {
      console.error("Symptoms POST failed:", error);
      return json(res, 500, { error: "Failed to log symptom" });
    }
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}
