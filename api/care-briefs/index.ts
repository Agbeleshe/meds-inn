import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "../lib/auth";
import { canEditMotherCare } from "../../src/lib/assignments";
import { filterMothersForRole } from "../../src/lib/assignments";
import { listMotherRecordsFast } from "../lib/mothers";
import { getCareBriefRecord, putCareBriefRecord } from "../lib/care-brief-records";
import { gatherCareBriefContext } from "../lib/care-brief-context";
import { generateCareBriefFromContext } from "../lib/care-brief-generator";
import { json, methodNotAllowed, readBody } from "../lib/handler";

/** GET/POST /api/care-briefs — list briefs; POST regenerateAll */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const role = String(user.role);
  if (role === "mother") {
    return json(res, 403, { error: "Care briefs are for clinical staff only" });
  }

  const hospitalId = String(user.hospitalId ?? "ELR");
  const userRef = {
    id: String(user.id),
    role: role as "admin" | "nurse" | "doctor" | "mother",
    motherId: user.motherId as string | undefined,
    name: String(user.name ?? ""),
    hospitalId,
  };

  const allMothers = await listMotherRecordsFast(hospitalId);
  const mothers = filterMothersForRole(allMothers as Parameters<typeof filterMothersForRole>[0], userRef);

  if (req.method === "GET") {
    const items = await Promise.all(
      mothers.map(async (mother) => {
        const motherRef = {
          assignedNurseUserId: mother.assignedNurseUserId,
          assignedDoctorUserId: mother.assignedDoctorUserId,
          nurse: mother.nurse,
          doctor: mother.doctor,
        };
        const canEdit = canEditMotherCare(
          { id: userRef.id, role: userRef.role as "admin" | "nurse" | "doctor", name: userRef.name },
          motherRef,
        );

        let brief = await getCareBriefRecord(mother.id);
        if (!brief && canEdit) {
          const ctx = await gatherCareBriefContext(mother.id, hospitalId);
          if (ctx) {
            brief = await putCareBriefRecord(generateCareBriefFromContext(ctx));
          }
        }

        return {
          motherId: mother.id,
          motherName: mother.name,
          initials: mother.initials,
          riskLevel: mother.riskLevel,
          gestationalWeek: mother.gestationalWeek,
          canEdit,
          brief,
        };
      }),
    );
    return json(res, 200, { items, source: "dynamodb" });
  }

  if (req.method === "POST") {
    const body = await readBody<{ regenerateAll?: boolean }>(req);
    if (!body?.regenerateAll) {
      return json(res, 400, { error: "Use POST /api/care-briefs/:motherId to regenerate one brief" });
    }

    const editable = mothers.filter((mother) =>
      canEditMotherCare(
        { id: userRef.id, role: userRef.role as "admin" | "nurse" | "doctor", name: userRef.name },
        {
          assignedNurseUserId: mother.assignedNurseUserId,
          assignedDoctorUserId: mother.assignedDoctorUserId,
          nurse: mother.nurse,
          doctor: mother.doctor,
        },
      ),
    );

    const regenerated = [];
    for (const mother of editable) {
      const ctx = await gatherCareBriefContext(mother.id, hospitalId);
      if (!ctx) continue;
      const brief = generateCareBriefFromContext(ctx, String(user.name));
      await putCareBriefRecord(brief);
      regenerated.push(brief);
    }

    return json(res, 200, { count: regenerated.length, items: regenerated, source: "dynamodb" });
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}
