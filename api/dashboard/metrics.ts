import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME, ENTITY_PREFIX, stripKeys } from "../lib/dynamodb";
import { prefixFilter } from "../lib/items";
import { json, methodNotAllowed } from "../lib/handler";
import { listMotherRecords } from "../lib/mothers";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** GET /api/dashboard/metrics — optional ?hospitalId= */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const hospitalId =
    typeof req.query.hospitalId === "string" ? req.query.hospitalId.trim() : "ELR";

  try {
    const mothers = await listMotherRecords(hospitalId);

    const [apptsRes, teamRes] = await Promise.all([
      dynamodb.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          Limit: 100,
          ...prefixFilter(ENTITY_PREFIX.appointment),
        }),
      ),
      dynamodb.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          Limit: 50,
          ...prefixFilter(ENTITY_PREFIX.team),
        }),
      ),
    ]);

    const appointments = (apptsRes.Items ?? [])
      .map((item) => stripKeys(item as Record<string, unknown>))
      .filter((a) => String(a.hospitalId ?? "ELR") === hospitalId);

    const team = (teamRes.Items ?? [])
      .map((item) => stripKeys(item as Record<string, unknown>))
      .filter((t) => String(t.hospitalId ?? "ELR") === hospitalId);

    const today = todayIso();
    const highRisk = mothers.filter((m) => m.riskLevel === "high").length;
    const postpartum = mothers.filter((m) => m.status === "postpartum").length;
    const activePregnancy = mothers.filter((m) => m.status === "active-pregnancy").length;
    const missedFollowUp = mothers.filter((m) => m.status === "missed-followup").length;
    const todayAppointments = appointments.filter(
      (a) => a.date === today && a.status === "scheduled",
    ).length;
    const avgAdherence =
      mothers.length > 0
        ? Math.round(
            mothers.reduce((sum, m) => sum + Number(m.adherence ?? 0), 0) / mothers.length,
          )
        : 0;

    const needFollowUp = mothers
      .filter((m) => m.status === "missed-followup" || m.riskLevel === "high")
      .slice(0, 6)
      .map((m) => ({
        id: m.id,
        name: m.name,
        initials: m.initials,
        gestationalWeek: m.gestationalWeek,
        riskLevel: m.riskLevel,
        status: m.status,
        lastCheckIn: m.lastCheckIn,
        adherence: m.adherence,
        nextAppointment: m.nextAppointment,
      }));

    const upcomingAppointments = appointments
      .filter((a) => a.status === "scheduled")
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(0, 6);

    return json(res, 200, {
      metrics: {
        totalMothers: mothers.length,
        activePregnancies: activePregnancy,
        highRiskCases: highRisk,
        todayAppointments,
        missedFollowUps: missedFollowUp,
        postpartumMothers: postpartum,
        medicationAdherence: avgAdherence,
        careContinuityScore: Math.min(100, avgAdherence + 8),
        teamMembers: team.length,
      },
      needFollowUp,
      upcomingAppointments,
      teamSnapshot: team.slice(0, 4),
      source: "dynamodb",
    });
  } catch (error) {
    console.error("Dashboard metrics failed:", error);
    return json(res, 500, { error: "Failed to load dashboard metrics" });
  }
}
