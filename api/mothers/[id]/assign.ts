import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById, getUserById } from "../../lib/auth";
import { getMotherRecordResolved, putMotherRecordResolved, normalizeMotherRecord } from "../../lib/mothers";
import { createNotification } from "../../lib/notifications";
import { json, methodNotAllowed, readBody } from "../../lib/handler";

/** PATCH /api/mothers/:id/assign — admin assigns nurse & doctor */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PATCH") return methodNotAllowed(res, ["PATCH"]);

  const id = typeof req.query.id === "string" ? req.query.id : undefined;
  if (!id) return json(res, 400, { error: "Mother id is required" });

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });
  if (user.role !== "admin") return json(res, 403, { error: "Admin only" });

  try {
    let existing: Record<string, unknown> | null = null;
    let persisted = true;

    existing = await getMotherRecordResolved(id);
    if (!existing) return json(res, 404, { error: "Mother not found" });

    const body = await readBody<{
      assignedNurseUserId?: string | null;
      assignedDoctorUserId?: string | null;
      nurse?: string;
      doctor?: string;
    }>(req);

    const updated = normalizeMotherRecord({
      ...existing,
      assignedNurseUserId: body?.assignedNurseUserId ?? existing.assignedNurseUserId ?? null,
      assignedDoctorUserId: body?.assignedDoctorUserId ?? existing.assignedDoctorUserId ?? null,
      nurse: body?.nurse ?? existing.nurse,
      doctor: body?.doctor ?? existing.doctor,
      specialistRequestStatus: null,
      specialistRequestType: null,
      specialistRequestNote: null,
    });

    persisted = await putMotherRecordResolved(updated as unknown as Record<string, unknown>);

    const motherName = String(existing.name ?? id);
    const notifyIds = [
      updated.assignedNurseUserId,
      updated.assignedDoctorUserId,
    ].filter(Boolean) as string[];

    for (const staffId of notifyIds) {
      try {
        const staff = await getUserById(staffId);
        if (!staff) continue;
        await createNotification({
          userId: staffId,
          type: "assignment",
          title: "New patient assignment",
          body: `You have been assigned to ${motherName} (${id}). Review their care plan.`,
          motherId: id,
        });
      } catch (notifyErr) {
        console.warn("Notification failed for", staffId, notifyErr);
      }
    }

    return json(res, 200, {
      item: updated,
      source: persisted ? "dynamodb" : "demo",
      ...(persisted ? {} : { note: "Database unreachable — assignment applied in session only; re-seed when AWS is connected" }),
    });
  } catch (error) {
    console.error("Assign failed:", error);
    return json(res, 500, { error: "Failed to assign staff" });
  }
}
