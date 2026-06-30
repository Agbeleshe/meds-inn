import type { VercelRequest, VercelResponse } from "@vercel/node";
import { findUserByCredentials, stripSensitive } from "../lib/auth.js";
import { json, methodNotAllowed, readBody } from "../lib/handler.js";

interface LoginBody {
  email?: string;
  password?: string;
  role?: string;
  hospitalId?: string;
}

/** POST /api/auth/login — email + password + role + hospital */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const body = await readBody<LoginBody>(req);
  const email = body?.email?.trim();
  const password = body?.password;
  const role = body?.role;
  const hospitalId = body?.hospitalId;

  if (!email || !password || !role || !hospitalId) {
    return json(res, 400, {
      error: "Email, password, role, and hospital are required",
    });
  }

  try {
    const record = await findUserByCredentials(email, role, hospitalId);
    if (!record || String(record.password) !== password) {
      return json(res, 401, { error: "Invalid credentials for this role and hospital" });
    }

    const user = stripSensitive(record);
    const token = String(user.id);
    return json(res, 200, { user, token, source: "dynamodb" });
  } catch (error) {
    console.error("Login failed:", error);
    return json(res, 503, {
      error: "Sign-in service unavailable. Please try again later.",
    });
  }
}
