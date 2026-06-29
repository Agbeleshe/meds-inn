import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "../lib/auth";
import { canAccessMotherId } from "../lib/access";
import { getMotherRecordById } from "../lib/mothers";
import { applyPregnancyProgress } from "../../src/lib/pregnancy-stages";
import { json, methodNotAllowed } from "../lib/handler";

/** GET /api/pregnancy/:motherId — stages with progress from mother profile */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const motherId =
    typeof req.query.motherId === "string" ? req.query.motherId.trim() : undefined;
  if (!motherId) return json(res, 400, { error: "Mother id is required" });

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  try {
    const mother = await getMotherRecordById(motherId);
    if (!mother) return json(res, 404, { error: "Mother not found" });

    const hospitalId = String(mother.hospitalId ?? "ELR");
    if (!canAccessMotherId(user, motherId, hospitalId)) {
      return json(res, 403, { error: "Access denied" });
    }

    const stages = applyPregnancyProgress({
      gestationalWeek: Number(mother.gestationalWeek ?? 24),
      careStage: (mother.careStage as "pregnant" | "postpartum") ?? "pregnant",
      babyWeeks: Number(mother.babyWeeks ?? 0),
    });

    return json(res, 200, {
      motherId,
      motherName: mother.name,
      gestationalWeek: mother.gestationalWeek,
      stages,
      source: "dynamodb",
    });
  } catch (error) {
    console.error("GET pregnancy timeline failed:", error);
    const stages = applyPregnancyProgress({ gestationalWeek: 24 });
    return json(res, 200, {
      motherId,
      gestationalWeek: 24,
      stages,
      source: "demo",
    });
  }
}
