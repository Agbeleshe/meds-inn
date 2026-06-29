import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "./lib/auth.js";
import { listMotherRecordsFast } from "./lib/mothers.js";
import { canAccessMother } from "./lib/access.js";
import { getBabyChecklistDay, toggleBabyChecklistItem } from "./lib/baby-records.js";
import { json, methodNotAllowed, readBody } from "./lib/handler.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const hospitalId = String(user.hospitalId ?? "ELR");
  const role = String(user.role);
  let motherId = typeof req.query.motherId === "string" ? req.query.motherId.trim() : "";

  if (role === "mother") motherId = String(user.motherId ?? "");
  if (!motherId) return json(res, 400, { error: "motherId is required" });

  const mothers = await listMotherRecordsFast(hospitalId);
  const mother = mothers.find((m) => String(m.id) === motherId);
  if (!mother) return json(res, 404, { error: "Mother not found" });

  if (role === "mother" && String(user.motherId) !== motherId) {
    return json(res, 403, { error: "Access denied" });
  }
  if (role !== "mother" && !canAccessMother(user, mother)) {
    return json(res, 403, { error: "Access denied" });
  }

  if (req.method === "GET") {
    const day = await getBabyChecklistDay(motherId);
    const checklist = day.items.map((item) => ({
      ...item,
      done: day.completedItemIds.includes(item.id),
    }));
    return json(res, 200, { item: { ...day, checklist }, source: "dynamodb" });
  }

  if (req.method === "PATCH") {
    if (role !== "mother") {
      return json(res, 403, { error: "Only mothers can update baby checklist" });
    }
    try {
      const body = await readBody<{ itemId?: string }>(req);
      const itemId = String(body?.itemId ?? "").trim();
      if (!itemId) return json(res, 400, { error: "itemId is required" });

      const day = await toggleBabyChecklistItem(motherId, itemId);
      const checklist = day.items.map((item) => ({
        ...item,
        done: day.completedItemIds.includes(item.id),
      }));
      return json(res, 200, { item: { ...day, checklist }, source: "dynamodb" });
    } catch (error) {
      console.error("Baby checklist PATCH failed:", error);
      return json(res, 500, { error: "Failed to update checklist" });
    }
  }

  return methodNotAllowed(res, ["GET", "PATCH"]);
}
