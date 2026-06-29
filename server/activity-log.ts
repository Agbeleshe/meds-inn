import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "./lib/auth.js";
import { listActivityLog } from "./lib/activity-log.js";
import { json, methodNotAllowed } from "./lib/handler.js";

/** GET /api/activity-log — admin activity feed */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  if (user.role !== "admin" && user.role !== "doctor" && user.role !== "nurse") {
    return json(res, 403, { error: "Access denied" });
  }

  const hospitalId = String(user.hospitalId ?? "ELR");
  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 50;
  const items = await listActivityLog(hospitalId, Number.isFinite(limit) ? limit : 50);
  return json(res, 200, { items, source: "dynamodb" });
}
