import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PATIENTS } from "../src/lib/demo-data";
import { listMotherRecords, normalizeMotherRecord } from "./lib/mothers";
import { json, methodNotAllowed } from "./lib/handler";

function demoMothers(hospitalId?: string) {
  return PATIENTS.map((m) =>
    normalizeMotherRecord({ ...m, hospitalId: hospitalId ?? "ELR" }),
  ).filter((m) => !hospitalId || m.hospitalId === hospitalId);
}

/** GET /api/mothers — list mothers from DynamoDB (optional ?hospitalId= filter) */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const hospitalId =
    typeof req.query.hospitalId === "string" ? req.query.hospitalId.trim() : undefined;

  try {
    const items = await listMotherRecords(hospitalId);
    if (items.length === 0) {
      const demo = demoMothers(hospitalId);
      return json(res, 200, { items: demo, source: "demo", note: "No mothers in DB — showing demo patients" });
    }
    return json(res, 200, { items, source: "dynamodb" });
  } catch (error) {
    console.error("DynamoDB scan failed:", error);
    const demo = demoMothers(hospitalId);
    return json(res, 200, {
      items: demo,
      source: "demo",
      note: "Database unreachable — showing demo patients",
    });
  }
}
