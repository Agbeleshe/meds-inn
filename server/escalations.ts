import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "./lib/auth.js";
import { listMotherRecordsFast } from "./lib/mothers.js";
import { json, methodNotAllowed } from "./lib/handler.js";

/** GET /api/escalations — open escalated cases for admin and assigned clinical staff */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const role = String(user.role);
  if (!["admin", "nurse", "doctor"].includes(role)) {
    return json(res, 403, { error: "Clinical access required" });
  }

  const hospitalId = String(user.hospitalId ?? "ELR");
  const userId = String(user.id);

  try {
    const mothers = await listMotherRecordsFast(hospitalId);
    const items = mothers
      .filter((m) => String(m.escalationStatus ?? "") === "open")
      .filter((m) => {
        if (role === "admin") return true;
        const targets = (m.escalationTargets as string[] | undefined) ?? [];
        if (role === "nurse") {
          return (
            targets.includes("nurse") &&
            String(m.assignedNurseUserId ?? "") === userId
          );
        }
        if (role === "doctor") {
          return (
            targets.includes("doctor") &&
            String(m.assignedDoctorUserId ?? "") === userId
          );
        }
        return false;
      })
      .map((m) => ({
        motherId: m.id,
        motherName: m.name,
        severity: m.escalationSeverity ?? "serious",
        note: m.escalationNote ?? "",
        escalatedAt: m.escalationAt ?? "",
        escalatedBy: m.escalationBy ?? "",
        targets: m.escalationTargets ?? [],
      }))
      .sort((a, b) => String(b.escalatedAt).localeCompare(String(a.escalatedAt)));

    return json(res, 200, { items, source: "dynamodb" });
  } catch (error) {
    console.error("Escalations GET failed:", error);
    return json(res, 500, { error: "Failed to load escalations" });
  }
}
