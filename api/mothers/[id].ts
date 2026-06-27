import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "../lib/auth";
import { getMotherRecordById, putMotherRecord, trimesterFromWeeks } from "../lib/mothers";
import { json, methodNotAllowed, readBody } from "../lib/handler";

function canAccessMother(
  user: Record<string, unknown>,
  mother: Record<string, unknown>,
) {
  const role = String(user.role);
  if (role === "mother") {
    return String(user.motherId) === String(mother.id);
  }
  if (["admin", "nurse", "doctor"].includes(role)) {
    return String(user.hospitalId) === String(mother.hospitalId ?? "ELR");
  }
  return false;
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
      const mother = await getMotherRecordById(id);
      if (!mother) return json(res, 404, { error: "Mother not found" });
      if (!canAccessMother(user, mother)) return json(res, 403, { error: "Access denied" });
      return json(res, 200, { item: mother, source: "dynamodb" });
    } catch (error) {
      console.error("GET mother failed:", error);
      return json(res, 500, { error: "Failed to load mother profile" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const existing = await getMotherRecordById(id);
      if (!existing) return json(res, 404, { error: "Mother not found" });
      if (!canAccessMother(user, existing)) return json(res, 403, { error: "Access denied" });

      const body = await readBody<Record<string, unknown>>(req);
      const gestationalWeek = body.gestationalWeek ?? body.gestationalWeeks;
      const weeks =
        gestationalWeek !== undefined ? Number(gestationalWeek) : Number(existing.gestationalWeek ?? 0);

      const updated = {
        ...existing,
        ...body,
        id,
        gestationalWeek: weeks,
        trimester:
          body.trimester ??
          (weeks > 0 ? trimesterFromWeeks(weeks) : String(existing.trimester ?? "Enrolled")),
      };

      await putMotherRecord(updated);
      return json(res, 200, { item: updated, source: "dynamodb" });
    } catch (error) {
      console.error("PATCH mother failed:", error);
      return json(res, 500, { error: "Failed to update mother profile" });
    }
  }

  return methodNotAllowed(res, ["GET", "PATCH"]);
}
