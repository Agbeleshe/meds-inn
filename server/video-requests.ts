import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "./lib/auth.js";
import { listMotherRecordsFast, getMotherRecordResolved, putMotherRecordResolved } from "./lib/mothers.js";
import { canAccessMother } from "./lib/access.js";
import { createNotification } from "./lib/notifications.js";
import { logActivity } from "./lib/activity-log.js";
import { json, methodNotAllowed, readBody } from "./lib/handler.js";

/** GET pending video requests (clinical staff) · POST mother request */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const hospitalId = String(user.hospitalId ?? "ELR");
  const role = String(user.role);

  if (req.method === "GET") {
    if (!["admin", "nurse", "doctor"].includes(role)) {
      return json(res, 403, { error: "Clinical access required" });
    }

    const mothers = await listMotherRecordsFast(hospitalId);
    const items = mothers
      .filter((m) => String(m.videoCallRequestStatus ?? "") === "pending")
      .filter((m) => {
        if (role === "admin") return true;
        if (role === "nurse") return String(m.assignedNurseUserId ?? "") === String(user.id);
        if (role === "doctor") return String(m.assignedDoctorUserId ?? "") === String(user.id);
        return false;
      })
      .map((m) => ({
        motherId: m.id,
        motherName: m.name,
        note: m.videoCallRequestNote ?? "",
        requestedAt: m.videoCallRequestAt ?? "",
      }))
      .sort((a, b) => String(b.requestedAt).localeCompare(String(a.requestedAt)));

    return json(res, 200, { items, source: "dynamodb" });
  }

  if (req.method === "POST") {
    if (role !== "mother") {
      return json(res, 403, { error: "Only mothers can request a video call" });
    }

    const motherId = String(user.motherId ?? "");
    if (!motherId) return json(res, 400, { error: "Mother profile not linked" });

    try {
      const body = await readBody<{ note?: string }>(req);
      const existing = await getMotherRecordResolved(motherId);
      if (!existing) return json(res, 404, { error: "Mother not found" });

      const now = new Date().toISOString();
      const note = String(body?.note ?? "").trim();
      const updated = {
        ...existing,
        id: motherId,
        videoCallRequestStatus: "pending",
        videoCallRequestNote: note,
        videoCallRequestAt: now,
      };

      await putMotherRecordResolved(updated);

      const targets = [
        existing.assignedDoctorUserId ? String(existing.assignedDoctorUserId) : null,
        existing.assignedNurseUserId ? String(existing.assignedNurseUserId) : null,
      ].filter(Boolean) as string[];

      for (const userId of targets) {
        void createNotification({
          userId,
          type: "appointment",
          title: "Video meeting request",
          body: `${existing.name ?? "A patient"} would love to have a meeting with you.${note ? `\n\n"${note}"` : ""}`,
          motherId,
        }).catch((err) => console.warn("Video request notify failed:", err));
      }

      void logActivity({
        hospitalId,
        category: "video-call",
        action: "Video call requested",
        detail: note || "Patient requested a video consultation",
        actorName: String(user.name),
        actorUserId: String(user.id),
        actorRole: "mother",
        patientId: motherId,
        patientName: String(existing.name ?? ""),
      });

      return json(res, 201, { item: updated, source: "dynamodb" });
    } catch (error) {
      console.error("Video request POST failed:", error);
      return json(res, 500, { error: "Failed to submit video request" });
    }
  }

  if (req.method === "PATCH") {
    if (!["admin", "nurse", "doctor"].includes(role)) {
      return json(res, 403, { error: "Clinical access required" });
    }

    try {
      const body = (await readBody<{ motherId: string; status: "scheduled" | "resolved" }>(req)) ?? {} as any;
      const motherId = String(body?.motherId ?? "").trim();
      if (!motherId) return json(res, 400, { error: "motherId is required" });

      const existing = await getMotherRecordResolved(motherId);
      if (!existing || !canAccessMother(user, existing)) {
        return json(res, 403, { error: "Access denied" });
      }

      const updated = {
        ...existing,
        id: motherId,
        videoCallRequestStatus: body.status ?? "scheduled",
      };
      await putMotherRecordResolved(updated);
      return json(res, 200, { item: updated, source: "dynamodb" });
    } catch (error) {
      console.error("Video request PATCH failed:", error);
      return json(res, 500, { error: "Failed to update request" });
    }
  }

  return methodNotAllowed(res, ["GET", "POST", "PATCH"]);
}
