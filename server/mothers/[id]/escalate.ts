import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "../../lib/auth";
import { canAccessMother } from "../../lib/access";
import {
  getMotherRecordResolved,
  putMotherRecordResolved,
} from "../../lib/mothers";
import { createNotification, notifyHospitalAdmins } from "../../lib/notifications";
import { json, methodNotAllowed, readBody } from "../../lib/handler";

const VALID_SEVERITIES = new Set(["urgent", "serious", "mild"]);
const VALID_TARGETS = new Set(["doctor", "nurse", "admin"]);

function defaultTargetsForRole(role: string): string[] {
  if (role === "nurse") return ["doctor", "admin"];
  if (role === "doctor") return ["nurse", "admin"];
  if (role === "admin") return ["doctor", "nurse"];
  return ["admin"];
}

/** POST /api/mothers/:id/escalate — escalate to assigned care team members */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const id = typeof req.query.id === "string" ? req.query.id : undefined;
  if (!id) return json(res, 400, { error: "Mother id is required" });

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const role = String(user.role);
  if (role !== "nurse" && role !== "doctor" && role !== "admin") {
    return json(res, 403, { error: "Only clinical staff can escalate cases" });
  }

  try {
    const existing = await getMotherRecordResolved(id);
    if (!existing) return json(res, 404, { error: "Mother not found" });
    if (!canAccessMother(user, existing as Record<string, unknown>)) {
      return json(res, 403, { error: "Access denied" });
    }

    const body = await readBody<{ note?: string; severity?: string; targets?: string[] }>(req);
    const note = String(body?.note ?? "").trim();
    const severity = String(body?.severity ?? "serious").trim().toLowerCase();

    let targets = Array.isArray(body?.targets)
      ? body.targets.filter((t) => VALID_TARGETS.has(String(t)))
      : defaultTargetsForRole(role);

    if (targets.length === 0) targets = defaultTargetsForRole(role);

    if (!note) return json(res, 400, { error: "Escalation note is required" });
    if (!VALID_SEVERITIES.has(severity)) {
      return json(res, 400, { error: "Severity must be urgent, serious, or mild" });
    }

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      escalationNote: note,
      escalationSeverity: severity,
      escalationAt: now,
      escalationBy: String(user.name),
      escalationByUserId: String(user.id),
      escalationStatus: "open",
      escalationTargets: targets,
    };

    await putMotherRecordResolved(updated);

    const motherName = String(existing.name ?? id);
    const hospitalId = String(existing.hospitalId ?? user.hospitalId ?? "ELR");
    const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1);
    const notifyPayload = {
      type: "escalation",
      title: `${severityLabel} case escalation — ${motherName}`,
      body: `${user.name} escalated ${motherName}: ${note}`,
      motherId: id,
    };

    const notified = new Set<string>();

    if (targets.includes("admin")) {
      await notifyHospitalAdmins(hospitalId, notifyPayload).catch((err) =>
        console.warn("Escalation admin notify failed:", err),
      );
    }

    if (targets.includes("nurse") && existing.assignedNurseUserId) {
      const nurseId = String(existing.assignedNurseUserId);
      if (!notified.has(nurseId) && nurseId !== String(user.id)) {
        notified.add(nurseId);
        await createNotification({ ...notifyPayload, userId: nurseId }).catch((err) =>
          console.warn("Escalation nurse notify failed:", err),
        );
      }
    }

    if (targets.includes("doctor") && existing.assignedDoctorUserId) {
      const doctorId = String(existing.assignedDoctorUserId);
      if (!notified.has(doctorId) && doctorId !== String(user.id)) {
        notified.add(doctorId);
        await createNotification({ ...notifyPayload, userId: doctorId }).catch((err) =>
          console.warn("Escalation doctor notify failed:", err),
        );
      }
    }

    return json(res, 200, { item: updated, source: "dynamodb" });
  } catch (error) {
    console.error("Case escalation failed:", error);
    return json(res, 500, { error: "Failed to escalate case" });
  }
}
