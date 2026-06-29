import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "../lib/auth.js";
import { buildDashboardMetrics } from "../lib/dashboard-metrics.js";
import { json, methodNotAllowed } from "../lib/handler.js";

/** GET /api/dashboard/metrics — role-scoped dashboard data */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const role = String(user.role);
  if (role === "mother") {
    return json(res, 403, { error: "Use the mother dashboard for patient view" });
  }

  const hospitalId = String(user.hospitalId ?? "ELR");

  try {
    const payload = await buildDashboardMetrics(user, hospitalId);
    return json(res, 200, payload);
  } catch (error) {
    console.error("Dashboard metrics failed:", error);
    return json(res, 500, { error: "Failed to load dashboard metrics" });
  }
}
