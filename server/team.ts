import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME, ENTITY_PREFIX, stripKeys } from "./lib/dynamodb.js";
import { prefixFilter } from "./lib/items.js";
import { json, methodNotAllowed } from "./lib/handler.js";

/** GET /api/team — optional ?hospitalId= */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const hospitalId =
    typeof req.query.hospitalId === "string" ? req.query.hospitalId.trim() : undefined;

  try {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        Limit: 50,
        ...prefixFilter(ENTITY_PREFIX.team),
      }),
    );
    let items = (result.Items ?? []).map((item) => stripKeys(item as Record<string, unknown>));
    if (hospitalId) {
      items = items.filter((item) => String(item.hospitalId ?? "ELR") === hospitalId);
    }
    return json(res, 200, { items, source: "dynamodb" });
  } catch (error) {
    console.error("Team scan failed:", error);
    return json(res, 500, { error: "Failed to load team" });
  }
}
