import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "../lib/auth";
import { listMotherRecordsFast } from "../lib/mothers";
import { getCarePlanRecord } from "../lib/care-plans";
import { buildDefaultCarePlan } from "../../src/lib/care-plan-templates";
import { processDailyChecklist, type DailyChecklistAssignment } from "../lib/checklist-daily";
import {
  canEditMotherCare,
  isAssignedToMother,
  filterMothersByAssignmentTab,
} from "../../src/lib/assignments";
import { json, methodNotAllowed } from "../lib/handler";

/** GET /api/care-plans — summaries for role-filtered mothers */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const tab =
    typeof req.query.tab === "string" ? req.query.tab : "all";
  const assignmentTab = (["all", "assigned", "unassigned"].includes(tab)
    ? tab
    : "all") as "all" | "assigned" | "unassigned";

  const hospitalId = String(user.hospitalId ?? "ELR");

  try {
    let mothers: any[] = await listMotherRecordsFast(hospitalId);
    mothers = filterMothersByAssignmentTab(
      mothers as Parameters<typeof filterMothersByAssignmentTab>[0],
      { id: String(user.id), role: user.role as "admin" | "nurse" | "doctor" | "mother" },
      assignmentTab,
    );

    const summaries = await Promise.all(
      mothers.map(async (mother) => {
        const stored = await getCarePlanRecord(String(mother.id));
        const plan = stored ?? buildDefaultCarePlan(String(mother.id));
        const planRecord = plan as Record<string, unknown>;
        const dailyChecklist = planRecord.dailyChecklist as DailyChecklistAssignment | undefined;
        const processed = await processDailyChecklist(String(mother.id), dailyChecklist ?? null);
        const checklist = processed.motherChecklist.length > 0
          ? processed.motherChecklist
          : ((planRecord.motherChecklist as { done?: boolean }[]) ?? []);
        const adherencePct = processed.adherence?.adherencePercent ?? (
          checklist.length > 0
            ? Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100)
            : 0
        );
        const userRef = {
          id: String(user.id),
          role: user.role as "admin" | "nurse" | "doctor",
          name: String(user.name ?? ""),
        };
        const motherRef = {
          assignedNurseUserId: mother.assignedNurseUserId as string | null,
          assignedDoctorUserId: mother.assignedDoctorUserId as string | null,
          nurse: String(mother.nurse ?? "To be assigned"),
          doctor: String(mother.doctor ?? "To be assigned"),
        };

        return {
          motherId: mother.id,
          motherName: mother.name,
          gestationalWeek: mother.gestationalWeek,
          assignedNurseUserId: mother.assignedNurseUserId,
          assignedDoctorUserId: mother.assignedDoctorUserId,
          nurse: mother.nurse,
          doctor: mother.doctor,
          checklistTotal: checklist.length,
          checklistDone: checklist.filter((c) => c.done).length,
          checklistAdherence: adherencePct,
          hasDailyChecklist: Boolean(dailyChecklist?.items?.length),
          canEdit: canEditMotherCare(userRef, motherRef),
          isAssignedToMe: isAssignedToMother(userRef, motherRef),
        };
      }),
    );

    return json(res, 200, { items: summaries, source: "dynamodb" });
  } catch (error) {
    console.error("Care plan list failed:", error);
    return json(res, 500, { error: "Failed to load care plans" });
  }
}
