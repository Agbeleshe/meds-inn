import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "../../lib/auth.js";
import {
  getMotherRecordResolved,
  putMotherRecordResolved,
} from "../../lib/mothers";
import { notifyHospitalAdmins } from "../../lib/notifications.js";
import { json, methodNotAllowed, readBody } from "../../lib/handler.js";

const REQUEST_LABELS: Record<string, string> = {
  request: "requested a specialist",
  change: "requested a change of specialist",
  report: "reported their specialist",
};

/** POST /api/mothers/:id/specialist-request — mother requests / reports specialist */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const id = typeof req.query.id === "string" ? req.query.id : undefined;
  if (!id) return json(res, 400, { error: "Mother id is required" });

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  if (user.role !== "mother" || user.motherId !== id) {
    return json(res, 403, { error: "Only the enrolled mother can submit this request" });
  }

  try {
    const body = await readBody<{ type?: string; note?: string }>(req);
    const type = body?.type ?? "request";
    if (!["request", "change", "report"].includes(type)) {
      return json(res, 400, { error: "Invalid request type" });
    }

    const existing = await getMotherRecordResolved(id);
    if (!existing) return json(res, 404, { error: "Mother not found" });

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      specialistRequestType: type,
      specialistRequestNote: body?.note?.trim() ?? "",
      specialistRequestAt: now,
      specialistRequestStatus: "pending",
    };

    const persisted = await putMotherRecordResolved(updated);

    const motherName = String(existing.name ?? id);
    const hospitalId = String(existing.hospitalId ?? user.hospitalId ?? "ELR");
    const action = REQUEST_LABELS[type] ?? "submitted a specialist request";

    await notifyHospitalAdmins(hospitalId, {
      type: "specialist-request",
      title: "Specialist request",
      body: `${motherName} ${action}.${body?.note ? ` Note: ${body.note.trim()}` : ""}`,
      motherId: id,
    }).catch((notifyErr) => {
      console.warn("Admin notification failed:", notifyErr);
    });

    return json(res, 200, {
      item: updated,
      source: persisted ? "dynamodb" : "demo",
    });
  } catch (error) {
    console.error("Specialist request failed:", error);
    return json(res, 500, { error: "Failed to submit request" });
  }
}
