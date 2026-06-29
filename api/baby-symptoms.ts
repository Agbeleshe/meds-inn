import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "./lib/auth";
import { listMotherRecordsFast } from "./lib/mothers";
import { canAccessMother } from "./lib/access";
import { listBabySymptomRecords, putBabySymptomRecord, localDateString } from "./lib/baby-records";
import { json, methodNotAllowed, readBody } from "./lib/handler";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const hospitalId = String(user.hospitalId ?? "ELR");
  const role = String(user.role);
  let motherId = typeof req.query.motherId === "string" ? req.query.motherId.trim() : "";

  if (role === "mother") {
    motherId = String(user.motherId ?? "");
  }
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
    const items = await listBabySymptomRecords(motherId);
    return json(res, 200, { items, source: "dynamodb" });
  }

  if (req.method === "POST") {
    if (role !== "mother") {
      return json(res, 403, { error: "Only mothers can log baby symptoms" });
    }
    try {
      const body = await readBody<Record<string, unknown>>(req);
      const symptom = String(body?.symptom ?? "").trim();
      if (!symptom) return json(res, 400, { error: "symptom is required" });

      const item = await putBabySymptomRecord(
        {
          symptom,
          severity: body?.severity ?? "mild",
          notes: body?.notes ?? "",
          date: body?.date ?? localDateString(),
          recordedAt: new Date().toISOString(),
        },
        motherId,
      );
      return json(res, 201, { item, source: "dynamodb" });
    } catch (error) {
      console.error("Baby symptom POST failed:", error);
      return json(res, 500, { error: "Failed to save symptom" });
    }
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}
