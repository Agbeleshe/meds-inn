import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "./lib/auth";
import { listMotherRecordsResolved } from "./lib/mothers";
import { json, methodNotAllowed } from "./lib/handler";
import type { Mother } from "../src/types/clinical";
import { isMotherUnassigned, hasPendingSpecialistRequest } from "../src/lib/assignments";

/** GET /api/specialist-requests — admin waiting list */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });
  if (user.role !== "admin") return json(res, 403, { error: "Admin only" });

  const hospitalId = String(user.hospitalId ?? "ELR");

  try {
    const mothers = await listMotherRecordsResolved(hospitalId);
    const items = mothers
      .filter((m) =>
        hasPendingSpecialistRequest(m as Pick<Mother, "specialistRequestStatus" | "specialistRequestType">),
      )
      .map((m) => ({
        motherId: m.id,
        motherName: m.name,
        gestationalWeek: m.gestationalWeek,
        nurse: m.nurse,
        doctor: m.doctor,
        assignedNurseUserId: m.assignedNurseUserId,
        assignedDoctorUserId: m.assignedDoctorUserId,
        specialistRequestType: m.specialistRequestType,
        specialistRequestNote: m.specialistRequestNote,
        specialistRequestAt: m.specialistRequestAt,
        specialistRequestStatus: m.specialistRequestStatus,
        unassigned: isMotherUnassigned(m as Pick<Mother, "assignedNurseUserId" | "assignedDoctorUserId">),
        pendingRequest: hasPendingSpecialistRequest(m as Pick<Mother, "specialistRequestStatus" | "specialistRequestType">),
      }))
      .sort((a, b) => {
        if (a.pendingRequest && !b.pendingRequest) return -1;
        if (!a.pendingRequest && b.pendingRequest) return 1;
        return String(b.specialistRequestAt ?? "").localeCompare(String(a.specialistRequestAt ?? ""));
      });

    return json(res, 200, { items, source: "dynamodb" });
  } catch (error) {
    console.error("Specialist requests list failed:", error);
    return json(res, 500, { error: "Failed to load waiting list" });
  }
}
