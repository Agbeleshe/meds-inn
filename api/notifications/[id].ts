import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "../lib/auth";
import { markNotificationRead } from "../lib/notifications";
import { json, methodNotAllowed } from "../lib/handler";

/** PATCH /api/notifications/:id — mark one notification as read */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PATCH") return methodNotAllowed(res, ["PATCH"]);

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const id = String(req.query.id ?? "").trim();
  if (!id) return json(res, 400, { error: "Notification id is required" });

  try {
    const item = await markNotificationRead(String(user.id), id);
    if (!item) return json(res, 404, { error: "Notification not found" });
    return json(res, 200, { item, source: "dynamodb" });
  } catch (error) {
    console.error("Notification PATCH failed:", error);
    return json(res, 500, { error: "Failed to update notification" });
  }
}
