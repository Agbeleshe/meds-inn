import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBearerToken, getUserRecordById } from "../lib/auth";
import { canAccessMotherId } from "../lib/access";
import { canEditMotherCare } from "../../src/lib/assignments";
import { getMotherRecordResolved } from "../lib/mothers";
import { getCarePlanRecord, putCarePlanRecord } from "../lib/care-plans";
import { buildDefaultCarePlan } from "../../src/lib/care-plan-templates";
import {
  buildDailyChecklistAssignment,
  processDailyChecklist,
  resetChecklistHistory,
  toggleDailyChecklistItem,
  type DailyChecklistAssignment,
} from "../lib/checklist-daily";
import { notifyMotherCarePlanAssigned } from "../lib/care-plan-notify";
import { json, methodNotAllowed, readBody } from "../lib/handler";

async function enrichPlanResponse(
  motherId: string,
  plan: Record<string, unknown>,
  source: string,
  canEdit: boolean,
) {
  const dailyChecklist = plan.dailyChecklist as DailyChecklistAssignment | undefined;
  const processed = await processDailyChecklist(motherId, dailyChecklist ?? null);

  if (
    dailyChecklist &&
    processed.updatedAssignment &&
    processed.updatedAssignment.lastFinalizedDate !== dailyChecklist.lastFinalizedDate
  ) {
    await putCarePlanRecord(motherId, { dailyChecklist: processed.updatedAssignment });
  }

  const defaults = buildDefaultCarePlan(motherId);
  const useDaily = Boolean(dailyChecklist?.items?.length);

  return {
    item: {
      motherId,
      sections: plan.sections ?? defaults.sections,
      motherChecklist: useDaily
        ? processed.motherChecklist
        : (plan.motherChecklist ?? defaults.motherChecklist),
      education: plan.education ?? defaults.education,
      dailyChecklist: dailyChecklist ?? null,
      checklistAdherence: processed.adherence,
      todayDate: processed.todayDate,
      yesterdayDate: processed.yesterdayDate,
      yesterdaySummary: processed.yesterdaySummary,
      assignmentActive: processed.assignmentActive,
      updatedAt: plan.updatedAt,
    },
    source,
    canEdit,
  };
}

/** GET/PUT/PATCH /api/care-plans/:motherId */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const motherId =
    typeof req.query.motherId === "string" ? req.query.motherId.trim() : undefined;
  if (!motherId) return json(res, 400, { error: "Mother id is required" });

  const token = getBearerToken(req);
  if (!token) return json(res, 401, { error: "Missing authorization token" });

  const user = await getUserRecordById(token);
  if (!user) return json(res, 401, { error: "Invalid session" });

  const mother = await getMotherRecordResolved(motherId);
  if (!mother) return json(res, 404, { error: "Mother not found" });

  const hospitalId = String(mother.hospitalId ?? "ELR");
  if (user.role === "mother") {
    if (String(user.motherId) !== motherId) {
      return json(res, 403, { error: "Access denied" });
    }
  } else if (!canAccessMotherId(user, motherId, hospitalId)) {
    return json(res, 403, { error: "Access denied" });
  }

  const userRef = {
    id: String(user.id),
    role: user.role as "admin" | "nurse" | "doctor" | "mother",
    name: String(user.name ?? ""),
  };
  const motherRef = {
    assignedNurseUserId: mother.assignedNurseUserId,
    assignedDoctorUserId: mother.assignedDoctorUserId,
    nurse: mother.nurse,
    doctor: mother.doctor,
  };
  const canEdit = canEditMotherCare(userRef, motherRef);

  if (req.method === "GET") {
    try {
      const stored = await getCarePlanRecord(motherId);
      const plan = stored ?? buildDefaultCarePlan(motherId);
      const response = await enrichPlanResponse(
        motherId,
        plan as Record<string, unknown>,
        stored ? "dynamodb" : "demo",
        canEdit,
      );
      return json(res, 200, response);
    } catch (error) {
      console.error("GET care plan failed:", error);
      const response = await enrichPlanResponse(
        motherId,
        buildDefaultCarePlan(motherId) as unknown as Record<string, unknown>,
        "demo",
        canEdit,
      );
      return json(res, 200, response);
    }
  }

  if (req.method === "PUT") {
    if (!canEdit) {
      return json(res, 403, { error: "You are not assigned to edit this mother's care plan" });
    }
    try {
      const body = await readBody<{
        sections?: unknown[];
        motherChecklist?: unknown[];
        education?: unknown[];
        dailyChecklist?: {
          items?: { id?: string; text: string }[];
          durationDays?: number;
          startDate?: string;
        };
      }>(req);

      let patch: Record<string, unknown> = {};
      if (body?.sections) patch.sections = body.sections;
      if (body?.education) patch.education = body.education;

      if (body?.dailyChecklist?.items) {
        const assignment = buildDailyChecklistAssignment({
          items: body.dailyChecklist.items,
          durationDays: Number(body.dailyChecklist.durationDays ?? 7),
          startDate: body.dailyChecklist.startDate,
          createdBy: String(user.id),
          createdByName: String(user.name ?? "Care team"),
        });
        if (assignment.items.length === 0) {
          return json(res, 400, { error: "Add at least one checklist item" });
        }
        await resetChecklistHistory(motherId);
        patch = {
          ...patch,
          dailyChecklist: assignment,
          motherChecklist: [],
        };

        const saved = await putCarePlanRecord(motherId, patch);

        void notifyMotherCarePlanAssigned({
          patientId: motherId,
          clinicianName: String(user.name ?? "Your care team"),
          itemCount: assignment.items.length,
          durationDays: assignment.durationDays,
          startDate: assignment.startDate,
          endDate: assignment.endDate,
        });

        const response = await enrichPlanResponse(motherId, saved, "dynamodb", true);
        return json(res, 200, response);
      } else if (body?.motherChecklist) {
        patch.motherChecklist = body.motherChecklist;
      }

      const saved = await putCarePlanRecord(motherId, patch);
      const response = await enrichPlanResponse(motherId, saved, "dynamodb", true);
      return json(res, 200, response);
    } catch (error) {
      console.error("PUT care plan failed:", error);
      return json(res, 500, { error: "Failed to save care plan" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const body = await readBody<{ motherChecklist?: unknown[]; toggleItemId?: string }>(req);
      const stored = await getCarePlanRecord(motherId);
      const plan = (stored ?? buildDefaultCarePlan(motherId)) as Record<string, unknown>;
      const dailyChecklist = plan.dailyChecklist as DailyChecklistAssignment | undefined;

      if (user.role === "mother") {
        if (String(user.motherId) !== motherId) {
          return json(res, 403, { error: "Access denied" });
        }
      } else if (!canEdit) {
        return json(res, 403, { error: "You are not assigned to edit this care plan" });
      }

      if (body?.toggleItemId) {
        const itemId = String(body.toggleItemId);

        if (dailyChecklist?.items?.length) {
          try {
            await toggleDailyChecklistItem(motherId, dailyChecklist, itemId);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Cannot update checklist";
            return json(res, 400, { error: message });
          }
          const response = await enrichPlanResponse(
            motherId,
            plan,
            stored ? "dynamodb" : "demo",
            canEdit,
          );
          return json(res, 200, response);
        }

        const defaults = buildDefaultCarePlan(motherId);
        const checklist = (
          Array.isArray(plan.motherChecklist) && plan.motherChecklist.length
            ? plan.motherChecklist
            : defaults.motherChecklist
        ) as { id: string; text: string; done?: boolean; setBy?: string; setAt?: string }[];

        if (!checklist.some((item) => item.id === itemId)) {
          return json(res, 404, { error: "Checklist item not found" });
        }

        const updatedChecklist = checklist.map((item) =>
          item.id === itemId ? { ...item, done: !item.done } : item,
        );
        const saved = await putCarePlanRecord(motherId, { motherChecklist: updatedChecklist });
        const response = await enrichPlanResponse(motherId, saved, "dynamodb", canEdit);
        return json(res, 200, response);
      }

      if (!body?.motherChecklist || !Array.isArray(body.motherChecklist)) {
        return json(res, 400, { error: "toggleItemId or motherChecklist is required" });
      }

      const saved = await putCarePlanRecord(motherId, { motherChecklist: body.motherChecklist });
      const response = await enrichPlanResponse(motherId, saved, "dynamodb", canEdit);
      return json(res, 200, response);
    } catch (error) {
      console.error("PATCH care plan checklist failed:", error);
      const message = error instanceof Error ? error.message : "Failed to update checklist";
      return json(res, 500, { error: message });
    }
  }

  return methodNotAllowed(res, ["GET", "PUT", "PATCH"]);
}
