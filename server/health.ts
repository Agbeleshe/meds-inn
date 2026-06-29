import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed } from "./lib/handler.js";

/** GET /api/health — quick check that API routes and AWS env are wired */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  if (_req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  return json(res, 200, {
    ok: true,
    region: process.env.AWS_REGION ?? null,
    table: process.env.DYNAMODB_TABLE_NAME ?? null,
    hasAwsRole: Boolean(process.env.AWS_ROLE_ARN),
  });
}
