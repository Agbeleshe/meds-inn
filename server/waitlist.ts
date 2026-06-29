import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isValidEmail, putWaitlistEntry } from "./lib/auth.js";
import { sendWaitlistThankYouEmail } from "./lib/email.js";
import { json, methodNotAllowed, readBody } from "./lib/handler.js";

interface WaitlistBody {
  email?: string;
}

/** POST /api/waitlist — hospital partnership interest */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const body = await readBody<WaitlistBody>(req);
  const email = body?.email?.trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return json(res, 400, { error: "A valid email address is required" });
  }

  try {
    await putWaitlistEntry(email);
    const emailResult = await sendWaitlistThankYouEmail(email);

    return json(res, 201, {
      ok: true,
      email,
      emailed: emailResult.sent,
      message: emailResult.sent
        ? "Thank you — check your inbox for a confirmation email."
        : "Thank you — you are on the waitlist. We will email you when hospital onboarding opens.",
    });
  } catch (error) {
    console.error("Waitlist failed:", error);
    return json(res, 500, { error: "Could not save waitlist entry" });
  }
}
