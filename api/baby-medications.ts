import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "./lib/auth";
import { listMotherRecordsFast } from "./lib/mothers";
import { canAccessMother } from "./lib/access";
import { listBabyMedicationRecords, putBabyMedicationRecord } from "./lib/baby-records";
import { json, methodNotAllowed, readBody } from "./lib/handler";

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
    const items = await listBabyMedicationRecords(motherId);
    return json(res, 200, { items, source: "dynamodb" });
  }

  if (req.method === "POST") {
    if (!["admin", "nurse", "doctor"].includes(role)) {
      return json(res, 403, { error: "Clinical staff only" });
    }
    try {
      const body = await readBody<Record<string, unknown>>(req);
      const name = String(body?.name ?? "").trim();
      if (!name) return json(res, 400, { error: "name is required" });

      const item = await putBabyMedicationRecord(
        {
          name,
          dosage: body?.dosage ?? "",
          frequency: body?.frequency ?? "",
          instructions: body?.instructions ?? "",
          prescribedBy: String(user.name),
          startDate: body?.startDate ?? new Date().toISOString().slice(0, 10),
          active: true,
        },
        motherId,
      );
      return json(res, 201, { item, source: "dynamodb" });
    } catch (error) {
      console.error("Baby medication POST failed:", error);
      return json(res, 500, { error: "Failed to save medication" });
    }
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}
