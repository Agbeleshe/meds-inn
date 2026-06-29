import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { getBearerToken, getUserRecordById } from "./lib/auth";
import { listMotherRecordsFast, getMotherRecordResolved, putMotherRecordResolved } from "./lib/mothers";
import { canAccessMother } from "./lib/access";
import { dynamodb, TABLE_NAME, ENTITY_PREFIX } from "./lib/dynamodb";
import {
  babyWeeksFromBirthDate,
  getBabyProfileRecord,
  normalizeBabyProfile,
} from "./lib/baby-records";
import { json, methodNotAllowed, readBody } from "./lib/handler";

async function putBabyProfile(motherId: string, profile: Record<string, unknown>) {
  const normalized = normalizeBabyProfile(profile, motherId);
  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `${ENTITY_PREFIX.mother}${motherId}`,
        SK: "BABY#PROFILE",
        entityType: "BABY_PROFILE",
        ...normalized,
      },
    }),
  );
  return normalized;
}

/** GET/PUT /api/baby — baby profile for a mother */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const hospitalId = String(user.hospitalId ?? "ELR");
  const role = String(user.role);

  let motherId =
    typeof req.query.motherId === "string" ? req.query.motherId.trim() : undefined;

  if (role === "mother") {
    motherId = String(user.motherId ?? "");
    if (!motherId) return json(res, 400, { error: "Mother profile not linked" });
  } else if (!motherId) {
    return json(res, 400, { error: "motherId query parameter is required" });
  }

  const mothers = await listMotherRecordsFast(hospitalId);
  const mother = mothers.find((m) => String(m.id) === motherId);
  if (!mother) return json(res, 404, { error: "Mother not found" });

  if (role === "mother") {
    if (String(user.motherId) !== motherId) {
      return json(res, 403, { error: "Access denied" });
    }
  } else if (!canAccessMother(user, mother)) {
    return json(res, 403, { error: "Access denied" });
  }

  if (req.method === "GET") {
    const item = await getBabyProfileRecord(motherId!);
    return json(res, 200, { item, source: "dynamodb" });
  }

  if (req.method === "PUT") {
    if (role !== "mother") {
      return json(res, 403, { error: "Only mothers can update baby profile" });
    }

    try {
      const body = await readBody<Record<string, unknown>>(req);
      const existing = (await getBabyProfileRecord(motherId!)) ?? {};
      const item = await putBabyProfile(motherId!, { ...existing, ...body });

      if (item.birthDate) {
        const motherRecord = await getMotherRecordResolved(motherId!);
        if (motherRecord) {
          await putMotherRecordResolved({
            ...motherRecord,
            id: motherId!,
            babyWeeks: babyWeeksFromBirthDate(item.birthDate),
          });
        }
      }

      return json(res, 200, { item, source: "dynamodb" });
    } catch (error) {
      console.error("Baby PUT failed:", error);
      return json(res, 500, { error: "Failed to save baby profile" });
    }
  }

  return methodNotAllowed(res, ["GET", "PUT"]);
}
