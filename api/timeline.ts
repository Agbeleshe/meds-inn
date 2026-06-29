import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "./lib/auth";
import { canAccessMotherId } from "./lib/access";
import { getMotherRecordById } from "./lib/mothers";
import { listTimelineEvents } from "./lib/care-plans";
import { DEFAULT_TIMELINE_EVENTS } from "../src/lib/timeline-events";
import { json, methodNotAllowed } from "./lib/handler";

/** GET /api/timeline?motherId= */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const motherId =
    typeof req.query.motherId === "string" ? req.query.motherId.trim() : undefined;
  if (!motherId) return json(res, 400, { error: "motherId query is required" });

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const mother = await getMotherRecordById(motherId);
  const hospitalId = String(mother?.hospitalId ?? "ELR");
  if (!canAccessMotherId(user, motherId, hospitalId)) {
    return json(res, 403, { error: "Access denied" });
  }

  try {
    const items = await listTimelineEvents(motherId);
    if (items.length === 0) {
      return json(res, 200, {
        items: DEFAULT_TIMELINE_EVENTS.map((e) => ({ ...e, patientId: motherId })),
        source: "demo",
      });
    }
    return json(res, 200, { items, source: "dynamodb" });
  } catch (error) {
    console.error("GET timeline failed:", error);
    return json(res, 200, {
      items: DEFAULT_TIMELINE_EVENTS.map((e) => ({ ...e, patientId: motherId })),
      source: "demo",
    });
  }
}
