import type { VercelRequest, VercelResponse } from "@vercel/node";
import { filterMothersForRole } from "../src/lib/assignments.js";
import { getBearerToken, getUserRecordById } from "./lib/auth.js";
import { listMotherRecordsFast } from "./lib/mothers.js";
import { json, methodNotAllowed } from "./lib/handler.js";

function userRefFromRecord(user: Record<string, unknown>, hospitalId: string) {
  return {
    id: String(user.id),
    role: user.role as "admin" | "nurse" | "doctor" | "mother",
    motherId: user.motherId as string | undefined,
    name: user.name as string | undefined,
    hospitalId,
  };
}

/** GET /api/mothers — list mothers from DynamoDB (optional ?hospitalId= filter) */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const hospitalId =
    typeof req.query.hospitalId === "string"
      ? req.query.hospitalId.trim()
      : String(user.hospitalId ?? "ELR");

  const userRef = userRefFromRecord(user, hospitalId);

  try {
    const items = await listMotherRecordsFast(hospitalId);
    const filtered = filterMothersForRole(
      items as Parameters<typeof filterMothersForRole>[0],
      userRef,
    );

    return json(res, 200, { items: filtered, source: "dynamodb" });
  } catch (error) {
    console.error("Mothers list failed:", error);
    const items = filterMothersForRole(
      (await listMotherRecordsFast(hospitalId)) as Parameters<typeof filterMothersForRole>[0],
      userRef,
    );
    return json(res, 200, {
      items,
      source: "demo",
      note: "Database unreachable — showing demo patients",
    });
  }
}
