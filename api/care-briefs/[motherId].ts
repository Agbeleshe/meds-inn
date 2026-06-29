import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "../lib/auth";
import { canAccessMotherId } from "../lib/access";
import { canEditMotherCare } from "../../src/lib/assignments";
import { getMotherRecordResolved } from "../lib/mothers";
import { getCareBriefRecord, putCareBriefRecord } from "../lib/care-brief-records";
import { gatherCareBriefContext } from "../lib/care-brief-context";
import { generateCareBriefFromContext } from "../lib/care-brief-generator";
import { json, methodNotAllowed, readBody } from "../lib/handler";

/** GET/POST/PATCH /api/care-briefs/:motherId */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const motherId =
    typeof req.query.motherId === "string" ? req.query.motherId.trim() : undefined;
  if (!motherId) return json(res, 400, { error: "Mother id is required" });

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const role = String(user.role);
  if (role === "mother") {
    return json(res, 403, { error: "Care briefs are for clinical staff only" });
  }

  const mother = await getMotherRecordResolved(motherId);
  if (!mother) return json(res, 404, { error: "Mother not found" });

  const hospitalId = String(mother.hospitalId ?? "ELR");
  if (!canAccessMotherId(user, motherId, hospitalId)) {
    return json(res, 403, { error: "Access denied" });
  }

  const canEdit = canEditMotherCare(
    { id: String(user.id), role: role as "admin" | "nurse" | "doctor", name: String(user.name ?? "") },
    {
      assignedNurseUserId: mother.assignedNurseUserId,
      assignedDoctorUserId: mother.assignedDoctorUserId,
      nurse: mother.nurse,
      doctor: mother.doctor,
    },
  );

  if (req.method === "GET") {
    let brief = await getCareBriefRecord(motherId);
    const autoGenerate = req.query.generate !== "false";
    if (!brief && autoGenerate && canEdit) {
      const ctx = await gatherCareBriefContext(motherId, hospitalId);
      if (ctx) {
        brief = await putCareBriefRecord(generateCareBriefFromContext(ctx));
      }
    }
    return json(res, 200, { item: brief, canEdit, source: "dynamodb" });
  }

  if (req.method === "POST") {
    if (!canEdit) {
      return json(res, 403, { error: "You are not assigned to this mother" });
    }
    const ctx = await gatherCareBriefContext(motherId, hospitalId);
    if (!ctx) return json(res, 404, { error: "Could not gather patient context" });

    const brief = await putCareBriefRecord(generateCareBriefFromContext(ctx, String(user.name)));
    return json(res, 200, { item: brief, canEdit: true, source: "dynamodb" });
  }

  if (req.method === "PATCH") {
    if (!canEdit) {
      return json(res, 403, { error: "You are not assigned to this mother" });
    }
    const body = await readBody<{ reviewed?: boolean; clinicianNote?: string }>(req);
    const existing = await getCareBriefRecord(motherId);
    if (!existing) return json(res, 404, { error: "No brief found — generate one first" });

    const updated = await putCareBriefRecord({
      ...existing,
      reviewed: body?.reviewed ?? existing.reviewed,
      reviewedBy: body?.reviewed ? String(user.name) : existing.reviewedBy,
      reviewedAt: body?.reviewed ? new Date().toISOString() : existing.reviewedAt,
      clinicianNote: body?.clinicianNote ?? existing.clinicianNote,
    });

    return json(res, 200, { item: updated, canEdit: true, source: "dynamodb" });
  }

  return methodNotAllowed(res, ["GET", "POST", "PATCH"]);
}
