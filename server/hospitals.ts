import type { VercelRequest, VercelResponse } from "@vercel/node";
import { HOSPITALS } from "../src/lib/hospitals.js";
import { json, methodNotAllowed } from "./lib/handler.js";

/** GET /api/hospitals — partner hospitals for login/signup dropdowns */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  return json(res, 200, { items: HOSPITALS });
}
