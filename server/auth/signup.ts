import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "node:crypto";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME } from "../lib/dynamodb.js";
import {
  normalizeUsername,
  putUserWithLookup,
  stripSensitive,
  emailTaken,
} from "../lib/auth.js";
import { toMotherItem, toUserItem, toUserLookupItem } from "../lib/items.js";
import { json, methodNotAllowed, readBody } from "../lib/handler.js";

interface SignupBody {
  firstName?: string;
  lastName?: string;
  password?: string;
  hospitalId?: string;
  careStage?: "pregnant" | "postpartum";
  gestationalWeeks?: number;
  babyWeeks?: number;
  phone?: string;
  email?: string;
  notes?: string;
}

function initials(first: string, last: string) {
  return `${first.trim()[0] ?? ""}${last.trim()[0] ?? ""}`.toUpperCase() || "M";
}

/** POST /api/auth/signup — expecting mother self-registration */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const body = await readBody<SignupBody>(req);
  const firstName = body?.firstName?.trim();
  const lastName = body?.lastName?.trim();
  const password = body?.password;
  const hospitalId = body?.hospitalId;
  const careStage = body?.careStage;
  const email = body?.email?.trim();

  if (!firstName || !lastName || !password || !hospitalId || !careStage || !email) {
    return json(res, 400, { error: "Missing required signup fields (first name, last name, email, password, hospital, care stage)" });
  }

  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!gmailRegex.test(email)) {
    return json(res, 400, { error: "A valid @gmail.com address is required to register (e.g. user@gmail.com)" });
  }

  if (password.length < 6) {
    return json(res, 400, { error: "Password must be at least 6 characters" });
  }

  const fullName = `${firstName} ${lastName}`;
  const username = email;

  try {
    if (await emailTaken(email, hospitalId, "mother")) {
      return json(res, 409, {
        error: "An account with this email already exists at this hospital",
      });
    }

    const userId = `user-${randomUUID()}`;
    const motherId = `MED-${hospitalId}-${Date.now().toString(36).slice(-5).toUpperCase()}`;
    const gestationalWeeks =
      careStage === "pregnant" ? Number(body.gestationalWeeks ?? 0) : 0;
    const babyWeeks = careStage === "postpartum" ? Number(body.babyWeeks ?? 0) : 0;

    const userRecord = {
      id: userId,
      username,
      password,
      role: "mother",
      name: fullName,
      firstName,
      lastName,
      initials: initials(firstName, lastName),
      email,
      hospitalId,
      motherId,
      careStage,
      gestationalWeeks: careStage === "pregnant" ? gestationalWeeks : undefined,
      babyWeeks: careStage === "postpartum" ? babyWeeks : undefined,
      phone: body.phone?.trim(),
      notes: body.notes?.trim(),
      onboardingComplete: false,
    };

    const motherRecord = {
      id: motherId,
      name: fullName,
      initials: initials(firstName, lastName),
      age: 0,
      gestationalWeek: careStage === "pregnant" ? gestationalWeeks : 0,
      trimester: careStage === "pregnant" ? "Enrolled" : "Postpartum",
      riskLevel: "low",
      status: careStage === "pregnant" ? "new" : "postpartum",
      nurse: "To be assigned",
      doctor: "To be assigned",
      lastCheckIn: new Date().toISOString().slice(0, 10),
      nextAppointment: "",
      adherence: 100,
      edd: "",
      bloodGroup: "",
      allergies: "None",
      phone: body.phone?.trim() ?? "",
      concerns: body.notes ? [body.notes] : [],
      emergencyContact: "",
      hospitalId,
      onboardingComplete: false,
      careStage,
      babyWeeks: careStage === "postpartum" ? babyWeeks : undefined,
      assignedNurseUserId: null,
      assignedDoctorUserId: null,
      specialistRequestStatus: null,
      specialistRequestType: null,
    };

    await putUserWithLookup(
      toUserItem(userRecord as Record<string, unknown>),
      toUserLookupItem(userRecord as Record<string, unknown>),
    );
    await dynamodb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: toMotherItem(motherRecord as Record<string, unknown>),
      }),
    );

    const user = stripSensitive(userRecord as Record<string, unknown>);
    return json(res, 201, { user, token: userId });
  } catch (error) {
    console.error("Signup failed:", error);
    return json(res, 500, { error: "Signup failed" });
  }
}
