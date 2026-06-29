import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "./lib/auth";
import { listNotifications } from "./lib/notifications";
import { json, methodNotAllowed } from "./lib/handler";

/** GET /api/notifications */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  try {
    const items = await listNotifications(String(user.id));
    return json(res, 200, { items, source: "dynamodb" });
  } catch (error) {
    console.error("Notifications list failed:", error);
    return json(res, 200, { items: [], source: "demo" });
  }
}
