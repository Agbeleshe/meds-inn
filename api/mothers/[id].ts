import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "../lib/auth";
import { canAccessMother } from "../lib/access";
import {
  getMotherRecordResolved,
  putMotherRecordResolved,
  trimesterFromWeeks,
} from "../lib/mothers";
import { createNotification } from "../lib/notifications";
import { findMotherUserId } from "../lib/appointment-notify";
import { getWeekEducation } from "../../src/lib/pregnancy-week-education";
import { json, methodNotAllowed, readBody } from "../lib/handler";

function gestationalWeekFromEdd(edd: string, referenceDate = new Date()): number | null {
  if (!edd || !/^\d{4}-\d{2}-\d{2}$/.test(edd)) return null;
  const due = new Date(`${edd}T12:00:00`);
  const ref = new Date(referenceDate);
  ref.setHours(12, 0, 0, 0);
  const daysUntilDue = Math.round((due.getTime() - ref.getTime()) / 86400000);
  const weeks = Math.floor((280 - daysUntilDue) / 7);
  if (weeks < 1 || weeks > 42) return null;
  return weeks;
}

async function notifyWeekAdvance(
  motherId: string,
  motherName: string,
  week: number,
) {
  const userId = await findMotherUserId(motherId);
  if (!userId) return;
  const education = getWeekEducation(week);
  const tipPreview = education?.tips[0] ?? "Check your care plan for this week's guidance.";
  await createNotification({
    userId,
    type: "pregnancy-week",
    title: `Congratulations — you are ${week} weeks pregnant`,
    body: `Here are some professional tips for you: ${tipPreview}`,
    motherId,
  }).catch((err) => console.warn("Week advance notify failed:", err));
}

/** GET/PATCH /api/mothers/:id */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = typeof req.query.id === "string" ? req.query.id : undefined;
  if (!id) return json(res, 400, { error: "Mother id is required" });

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  if (req.method === "GET") {
    try {
      const mother = await getMotherRecordResolved(id);
      if (!mother) return json(res, 404, { error: "Mother not found" });
      if (!canAccessMother(user, mother as Record<string, unknown>)) return json(res, 403, { error: "Access denied" });
      return json(res, 200, { item: mother, source: "dynamodb" });
    } catch (error) {
      console.error("GET mother failed:", error);
      return json(res, 500, { error: "Failed to load mother profile" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const existing = await getMotherRecordResolved(id);
      if (!existing) return json(res, 404, { error: "Mother not found" });

      const role = String(user.role);
      const isSelf = role === "mother" && String(user.motherId) === id;
      if (!isSelf && !canAccessMother(user, existing as Record<string, unknown>)) {
        return json(res, 403, { error: "Access denied" });
      }

      const body = await readBody<Record<string, unknown>>(req);
      const previousWeek = Number(existing.gestationalWeek ?? 0);
      const gestationalWeek = body.gestationalWeek ?? body.gestationalWeeks;
      let weeks =
        gestationalWeek !== undefined ? Number(gestationalWeek) : previousWeek;

      const careStage = body.careStage ?? existing.careStage;
      if (
        isSelf &&
        careStage === "pregnant" &&
        String(existing.careStage ?? "pregnant") === "pregnant" &&
        existing.edd
      ) {
        const fromEdd = gestationalWeekFromEdd(String(existing.edd));
        if (fromEdd && fromEdd > weeks) weeks = fromEdd;
      }

      const allowedFields = isSelf
        ? [
            "age",
            "gestationalWeek",
            "gestationalWeeks",
            "trimester",
            "edd",
            "bloodGroup",
            "allergies",
            "careStage",
            "status",
            "babyWeeks",
            "lastCheckIn",
            "concerns",
          ]
        : Object.keys(body);

      const patch: Record<string, unknown> = {};
      for (const key of allowedFields) {
        if (body[key] !== undefined) patch[key] = body[key];
      }

      const becomingPostpartum =
        patch.careStage === "postpartum" ||
        patch.status === "postpartum" ||
        patch.status === "delivered";

      const updated = {
        ...existing,
        ...patch,
        id,
        gestationalWeek: becomingPostpartum ? previousWeek : weeks,
        trimester:
          patch.trimester ??
          (weeks > 0 && !becomingPostpartum
            ? trimesterFromWeeks(weeks)
            : String(existing.trimester ?? "Enrolled")),
        careStage: becomingPostpartum ? "postpartum" : patch.careStage ?? existing.careStage,
        status: becomingPostpartum
          ? (patch.status === "delivered" ? "delivered" : "postpartum")
          : patch.status ?? existing.status,
        babyWeeks:
          becomingPostpartum && patch.babyWeeks !== undefined
            ? Number(patch.babyWeeks)
            : patch.babyWeeks !== undefined
              ? Number(patch.babyWeeks)
              : existing.babyWeeks,
      };

      await putMotherRecordResolved(updated);

      if (
        !becomingPostpartum &&
        weeks > previousWeek &&
        String(updated.careStage ?? "pregnant") === "pregnant"
      ) {
        void notifyWeekAdvance(id, String(existing.name ?? id), weeks);
      }

      if (becomingPostpartum && String(existing.careStage ?? "pregnant") !== "postpartum") {
        const targets = [
          existing.assignedNurseUserId ? String(existing.assignedNurseUserId) : null,
          existing.assignedDoctorUserId ? String(existing.assignedDoctorUserId) : null,
        ].filter(Boolean) as string[];
        for (const userId of targets) {
          void createNotification({
            userId,
            type: "baby-profile",
            title: `${existing.name} has delivered — baby profile needed`,
            body: "Please prompt the patient to complete baby information in Baby Care if not yet filled in.",
            motherId: id,
          }).catch((err) => console.warn("Postpartum team notify failed:", err));
        }
        const motherUserId = await findMotherUserId(id);
        if (motherUserId) {
          void createNotification({
            userId: motherUserId,
            type: "baby-profile",
            title: "Welcome to postpartum care",
            body: "Please add your baby's information in Baby Care so your team can support you fully.",
            motherId: id,
          }).catch((err) => console.warn("Postpartum mother notify failed:", err));
        }
      }

      return json(res, 200, { item: updated, source: "dynamodb" });
    } catch (error) {
      console.error("PATCH mother failed:", error);
      return json(res, 500, { error: "Failed to update mother profile" });
    }
  }

  return methodNotAllowed(res, ["GET", "PATCH"]);
}
