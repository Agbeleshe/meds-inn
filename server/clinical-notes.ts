import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "./lib/auth.js";
import { listMotherRecordsFast } from "./lib/mothers.js";
import { canAccessMother } from "./lib/access.js";
import { listClinicalNoteRecords, putClinicalNoteRecord } from "./lib/clinical-note-records.js";
import { findMotherUserId } from "./lib/appointment-notify.js";
import { createNotification } from "./lib/notifications.js";
import { logActivity } from "./lib/activity-log.js";
import { json, methodNotAllowed, readBody } from "./lib/handler.js";

/** GET/POST /api/clinical-notes */
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

    const items = await listClinicalNoteRecords(patientId);
    return json(res, 200, { items, source: "dynamodb" });
  }

  if (req.method === "POST") {
    if (user.role === "mother") {
      return json(res, 403, { error: "Mothers cannot add clinical notes" });
    }

    try {
      const body = await readBody<{ patientId: string; note: string; category?: string }>(req);
      const pid = String(body?.patientId ?? patientId).trim();
      const note = String(body?.note ?? "").trim();
      if (!pid || !note) {
        return json(res, 400, { error: "patientId and note are required" });
      }

      const mothers = await listMotherRecordsFast(hospitalId);
      const mother = mothers.find((m) => String(m.id) === pid);
      if (!mother || !canAccessMother(user, mother)) {
        return json(res, 403, { error: "Access denied" });
      }

      const today = new Date().toISOString().slice(0, 10);
      const record = await putClinicalNoteRecord(
        {
          id: `note-${Date.now()}`,
          patientId: pid,
          date: today,
          note,
          authorName: String(user.name),
          authorUserId: String(user.id),
          authorRole: String(user.role),
          category: body?.category ?? "visit",
          hospitalId,
          createdAt: new Date().toISOString(),
        },
        pid,
      );

      const motherUserId = await findMotherUserId(pid);
      if (motherUserId) {
        void createNotification({
          userId: motherUserId,
          type: "clinical-note",
          title: "New clinical note",
          body: `${user.name} added a note to your care record.`,
          motherId: pid,
        }).catch((err) => console.warn("Clinical note notify failed:", err));
      }

      void logActivity({
        hospitalId,
        category: "clinical-note",
        action: "Clinical note added",
        detail: note.slice(0, 120),
        actorName: String(user.name),
        actorUserId: String(user.id),
        actorRole: String(user.role),
        patientId: pid,
        patientName: String(mother.name ?? ""),
      });

      return json(res, 201, { item: record, source: "dynamodb" });
    } catch (error) {
      console.error("Clinical notes POST failed:", error);
      return json(res, 500, { error: "Failed to add note" });
    }
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}
