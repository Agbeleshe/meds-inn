import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME, ENTITY_PREFIX, stripKeys } from "./lib/dynamodb";
import { prefixFilter } from "./lib/items";
import { json, methodNotAllowed } from "./lib/handler";

/** GET /api/medications — optional ?patientId= & ?hospitalId= */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const patientId =
    typeof req.query.patientId === "string" ? req.query.patientId.trim() : undefined;
  const hospitalId =
    typeof req.query.hospitalId === "string" ? req.query.hospitalId.trim() : undefined;

  try {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        Limit: 100,
        ...prefixFilter(ENTITY_PREFIX.medication),
      }),
    );
    let items = (result.Items ?? []).map((item) => stripKeys(item as Record<string, unknown>));
    if (patientId) {
      items = items.filter((item) => String(item.patientId) === patientId);
    }
    if (hospitalId) {
      items = items.filter((item) => String(item.hospitalId ?? "ELR") === hospitalId);
    }
    return json(res, 200, { items, source: "dynamodb" });
  } catch (error) {
    console.error("Medications scan failed:", error);
    return json(res, 500, { error: "Failed to load medications" });
  }
}
