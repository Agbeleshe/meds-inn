import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserById } from "./lib/auth";
import { getDemoUserRecordById } from "./lib/demo-auth";
import { json, methodNotAllowed } from "./lib/handler";

/** GET /api/me — current user profile from DynamoDB USER# (Bearer token = user id) */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const token = getBearerToken(req);
  if (!token) {
    return json(res, 401, { error: "Missing authorization token" });
  }

  try {
    const user = await getUserById(token);
    if (!user) {
      return json(res, 404, { error: "User profile not found" });
    }

    const source = getDemoUserRecordById(token) ? "demo" : "dynamodb";
    return json(res, 200, { user, source });
  } catch (error) {
    console.error("GET /api/me failed:", error);
    const demo = getDemoUserRecordById(token);
    if (demo) {
      const { password: _p, ...user } = demo;
      return json(res, 200, { user, source: "demo" });
    }
    return json(res, 500, { error: "Failed to load profile" });
  }
}
