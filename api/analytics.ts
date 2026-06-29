import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "./lib/auth";
import { buildAnalytics, type AnalyticsRange } from "./lib/analytics";
import { json, methodNotAllowed } from "./lib/handler";

/** GET /api/analytics?range=6m */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const role = String(user.role);
  if (role === "mother") {
    return json(res, 403, { error: "Analytics are available to clinical staff only" });
  }

  const raw = typeof req.query.range === "string" ? req.query.range : "6m";
  const range = (["1m", "3m", "6m", "1y"].includes(raw) ? raw : "6m") as AnalyticsRange;
  const hospitalId = String(user.hospitalId ?? "ELR");

  try {
    const payload = await buildAnalytics(user, hospitalId, range);
    return json(res, 200, payload);
  } catch (error) {
    console.error("Analytics failed:", error);
    return json(res, 500, { error: "Failed to load analytics" });
  }
}
