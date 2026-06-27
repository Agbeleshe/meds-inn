import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getBearerToken,
  getUserRecordById,
  putUserItem,
  stripSensitive,
} from "../lib/auth";
import { getMotherRecordById, putMotherRecord, trimesterFromWeeks } from "../lib/mothers";
import { toUserItem } from "../lib/items";
import { json, methodNotAllowed, readBody } from "../lib/handler";

interface OnboardingBody {
  age?: number;
  phone?: string;
  email?: string;
  bloodGroup?: string;
  allergies?: string;
  emergencyContact?: string;
  edd?: string;
  gestationalWeeks?: number;
  babyWeeks?: number;
  concerns?: string;
  careStage?: "pregnant" | "postpartum";
}

/** POST /api/onboarding/complete — mother fills clinical profile after signup */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user || String(user.role) !== "mother") {
    return json(res, 403, { error: "Only mother accounts can complete onboarding" });
  }

  const motherId = String(user.motherId ?? "");
  if (!motherId) return json(res, 400, { error: "No care profile linked to this account" });

  const body = await readBody<OnboardingBody>(req);
  const age = Number(body.age);
  const phone = body.phone?.trim();
  const email = body.email?.trim();
  const bloodGroup = body.bloodGroup?.trim();
  const allergies = body.allergies?.trim();
  const emergencyContact = body.emergencyContact?.trim();

  if (!age || age < 13 || !phone || !email || !bloodGroup || !allergies || !emergencyContact) {
    return json(res, 400, {
      error: "Age, phone, email, blood group, allergies, and emergency contact are required",
    });
  }

  const careStage = body.careStage ?? (user.careStage as string) ?? "pregnant";
  const gestationalWeeks =
    careStage === "pregnant" ? Number(body.gestationalWeeks ?? user.gestationalWeeks ?? 0) : 0;
  const babyWeeks =
    careStage === "postpartum" ? Number(body.babyWeeks ?? user.babyWeeks ?? 0) : 0;

  if (careStage === "pregnant" && (!gestationalWeeks || gestationalWeeks < 1 || gestationalWeeks > 42)) {
    return json(res, 400, { error: "Enter a valid pregnancy week (1–42)" });
  }

  try {
    const existing = await getMotherRecordById(motherId);
    if (!existing) return json(res, 404, { error: "Care profile not found" });

    const concerns = body.concerns?.trim()
      ? body.concerns
          .trim()
          .split(/[\n,]+/)
          .map((c) => c.trim())
          .filter(Boolean)
      : (existing.concerns as string[]) ?? [];

    const motherRecord = {
      ...existing,
      age,
      phone,
      bloodGroup,
      allergies,
      emergencyContact,
      edd: body.edd?.trim() ?? String(existing.edd ?? ""),
      gestationalWeek: gestationalWeeks,
      trimester: gestationalWeeks > 0 ? trimesterFromWeeks(gestationalWeeks) : "Postpartum",
      status: careStage === "pregnant" ? "active-pregnancy" : "postpartum",
      concerns,
      onboardingComplete: true,
      careStage,
      babyWeeks: careStage === "postpartum" ? babyWeeks : undefined,
    };

    const userRecord = {
      ...user,
      email,
      phone,
      careStage,
      gestationalWeeks: careStage === "pregnant" ? gestationalWeeks : undefined,
      babyWeeks: careStage === "postpartum" ? babyWeeks : undefined,
      onboardingComplete: true,
    };

    await putMotherRecord(motherRecord);
    await putUserItem(toUserItem(userRecord));

    return json(res, 200, {
      user: stripSensitive(userRecord),
      mother: motherRecord,
    });
  } catch (error) {
    console.error("Onboarding complete failed:", error);
    return json(res, 500, { error: "Could not save onboarding profile" });
  }
}
