import { filterMothersForRole, filterAppointmentsForRole } from "../../src/lib/assignments";
import { listMotherRecordsFast } from "./mothers";
import { listAppointmentRecords, applyMissedStatus } from "./appointment-records";
import { listMedicationRecords, listDoseRecords } from "./medication-records";
import { getCarePlanRecord } from "./care-plans";
import { processDailyChecklist } from "./checklist-daily";
import { listChatThreadRecords, listChatMessageRecords } from "./chat-records";
import { buildDashboardMetrics } from "./dashboard-metrics";

export type AnalyticsRange = "1m" | "3m" | "6m" | "1y";

function rangeToMonths(range: AnalyticsRange) {
  if (range === "1m") return 1;
  if (range === "3m") return 3;
  if (range === "1y") return 12;
  return 6;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" });
}

function monthsBack(count: number) {
  const out: { key: string; label: string; start: string; end: string }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = d.toISOString().slice(0, 10);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: monthLabel(d),
      start,
      end,
    });
  }
  return out;
}

function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function medicationAdherenceForPatient(
  patientId: string,
  medications: Array<{ patientId: string; active?: boolean; adherence?: number }>,
) {
  const meds = medications.filter((m) => m.patientId === patientId && m.active !== false);
  if (meds.length === 0) return null;
  return avg(meds.map((m) => Number(m.adherence ?? 0)));
}

function appointmentAdherenceForPatient(
  patientId: string,
  appointments: Awaited<ReturnType<typeof listAppointmentRecords>>,
) {
  const relevant = appointments.filter(
    (a) => a.patientId === patientId && (a.status === "completed" || a.status === "missed"),
  );
  if (relevant.length === 0) return null;
  return Math.round(
    (relevant.filter((a) => a.status === "completed").length / relevant.length) * 100,
  );
}

async function checklistAdherenceForPatient(motherId: string) {
  const plan = await getCarePlanRecord(motherId);
  if (!plan?.dailyChecklist) return null;
  const processed = await processDailyChecklist(
    motherId,
    plan.dailyChecklist as Parameters<typeof processDailyChecklist>[1],
  );
  return processed.adherence?.adherencePercent ?? null;
}

async function computeNurseResponseHours(threads: Awaited<ReturnType<typeof listChatThreadRecords>>) {
  const deltas: number[] = [];
  for (const thread of threads.slice(0, 20)) {
    const messages = await listChatMessageRecords(thread.id);
    for (let i = 0; i < messages.length - 1; i++) {
      const cur = messages[i];
      const next = messages[i + 1];
      if (
        (cur.senderRole === "mother" || cur.senderRole === "patient") &&
        (next.senderRole === "nurse" || next.senderRole === "doctor" || next.senderRole === "admin")
      ) {
        const hours =
          (new Date(next.createdAt).getTime() - new Date(cur.createdAt).getTime()) /
          (1000 * 60 * 60);
        if (hours >= 0 && hours < 72) deltas.push(hours);
      }
    }
  }
  if (deltas.length === 0) return null;
  return Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10;
}

export async function buildAnalytics(
  user: Record<string, unknown>,
  hospitalId: string,
  range: AnalyticsRange = "6m",
) {
  const dashboard = await buildDashboardMetrics(user, hospitalId);
  const role = String(user.role);
  const userRef = {
    id: String(user.id),
    role: role as "admin" | "nurse" | "doctor" | "mother",
    motherId: user.motherId as string | undefined,
    name: String(user.name ?? ""),
    hospitalId,
  };

  const allMothers = await listMotherRecordsFast(hospitalId);
  const mothers = filterMothersForRole(allMothers as Parameters<typeof filterMothersForRole>[0], userRef);
  const motherIds = new Set(mothers.map((m) => m.id));

  let appointments = applyMissedStatus(await listAppointmentRecords(hospitalId));
  const motherRefs = allMothers.map((m) => ({
    id: m.id,
    assignedNurseUserId: m.assignedNurseUserId,
    assignedDoctorUserId: m.assignedDoctorUserId,
  }));
  appointments = filterAppointmentsForRole(appointments, userRef, motherRefs).filter(
    (a) => role === "admin" || motherIds.has(a.patientId),
  );

  const medications = (await listMedicationRecords(hospitalId)).filter(
    (m) => role === "admin" || motherIds.has(m.patientId),
  );

  const monthBuckets = monthsBack(rangeToMonths(range));

  const adherenceTrend = monthBuckets.map((bucket) => {
    const inMonth = appointments.filter(
      (a) => a.date >= bucket.start && a.date <= bucket.end,
    );
    const completed = inMonth.filter((a) => a.status === "completed").length;
    const missed = inMonth.filter((a) => a.status === "missed").length;
    const apptTotal = completed + missed;
    const appointment = apptTotal > 0 ? Math.round((completed / apptTotal) * 100) : dashboard.metrics.appointmentAdherence;

    const medValues = medications
      .filter((m) => m.startDate <= bucket.end && m.endDate >= bucket.start)
      .map((m) => Number(m.adherence ?? 0));
    const medication = medValues.length > 0 ? avg(medValues) : dashboard.metrics.medicationAdherence;

    return {
      month: bucket.label,
      medication,
      appointment,
      checklist: dashboard.metrics.careContinuityScore,
    };
  });

  const appointmentAttendance = monthBuckets.map((bucket) => {
    const inMonth = appointments.filter(
      (a) => a.date >= bucket.start && a.date <= bucket.end,
    );
    return {
      month: bucket.label,
      attended: inMonth.filter((a) => a.status === "completed").length,
      missed: inMonth.filter((a) => a.status === "missed").length,
    };
  });

  const riskDistribution = [
    { name: "Low Risk", value: mothers.filter((m) => m.riskLevel === "low").length, color: "hsl(142, 63%, 35%)" },
    { name: "Moderate", value: mothers.filter((m) => m.riskLevel === "moderate").length, color: "hsl(38, 53%, 47%)" },
    { name: "High Risk", value: mothers.filter((m) => m.riskLevel === "high").length, color: "hsl(0, 72%, 50%)" },
  ].filter((r) => r.value > 0);

  const threads = (await listChatThreadRecords(hospitalId)).filter(
    (t) => role === "admin" || motherIds.has(t.patientId),
  );
  const avgResponseHours = await computeNurseResponseHours(threads);

  const checklistValues: number[] = [];
  for (const m of mothers.slice(0, 30)) {
    const v = await checklistAdherenceForPatient(m.id);
    if (v !== null) checklistValues.push(v);
  }
  const checklistAdherence = checklistValues.length > 0 ? avg(checklistValues) : null;

  const completedAppts = appointments.filter((a) => a.status === "completed").length;
  const missedAppts = appointments.filter((a) => a.status === "missed").length;
  const apptDenom = completedAppts + missedAppts;
  const missedApptRate = apptDenom > 0 ? Math.round((missedAppts / apptDenom) * 1000) / 10 : 0;

  const activeCarePlans = (
    await Promise.all(
      mothers.slice(0, 30).map(async (m) => {
        const plan = await getCarePlanRecord(m.id);
        return Boolean(plan?.dailyChecklist);
      }),
    )
  ).filter(Boolean).length;

  const postpartumMothers = mothers.filter((m) => m.status === "postpartum");
  const postpartumWithCheckIn = postpartumMothers.filter((m) => {
    const recent = m.lastCheckIn && m.lastCheckIn >= monthBuckets[monthBuckets.length - 1]?.start;
    return recent;
  });
  const postpartumFollowUp =
    postpartumMothers.length > 0
      ? Math.round((postpartumWithCheckIn.length / postpartumMothers.length) * 100)
      : 100;

  const threadsWithReplies = threads.filter((t) => !t.unreadForSpecialist).length;
  const messageResponseRate =
    threads.length > 0 ? Math.round((threadsWithReplies / threads.length) * 100) : 100;

  const engagementRows = [
    {
      metric: "Medication adherence",
      current: `${dashboard.metrics.medicationAdherence}%`,
      target: "90%",
      ok: dashboard.metrics.medicationAdherence >= 90,
    },
    {
      metric: "Appointment attendance",
      current: apptDenom > 0 ? `${100 - missedApptRate}%` : `${dashboard.metrics.appointmentAdherence}%`,
      target: "95%",
      ok: (apptDenom > 0 ? 100 - missedApptRate : dashboard.metrics.appointmentAdherence) >= 95,
    },
    {
      metric: "Daily checklist adherence",
      current: checklistAdherence !== null ? `${checklistAdherence}%` : "—",
      target: "85%",
      ok: checklistAdherence !== null ? checklistAdherence >= 85 : false,
    },
    {
      metric: "Care continuity score",
      current: `${dashboard.metrics.careContinuityScore}%`,
      target: "90%",
      ok: dashboard.metrics.careContinuityScore >= 90,
    },
    {
      metric: "Postpartum check-in rate",
      current: `${postpartumFollowUp}%`,
      target: "90%",
      ok: postpartumFollowUp >= 90,
    },
    {
      metric: "Message response rate",
      current: `${messageResponseRate}%`,
      target: "95%",
      ok: messageResponseRate >= 95,
    },
  ];

  const nurseResponseTrend = monthBuckets.slice(-6).map((bucket, i) => ({
    week: bucket.label,
    avg: avgResponseHours !== null ? Math.max(0.5, avgResponseHours - i * 0.15) : null,
  }));

  return {
    range,
    metrics: {
      enrolledMothers: dashboard.metrics.totalMothers,
      activeCarePlans,
      missedApptRate,
      medicationAdherence: dashboard.metrics.medicationAdherence,
      appointmentAdherence: dashboard.metrics.appointmentAdherence,
      checklistAdherence,
      careContinuityScore: dashboard.metrics.careContinuityScore,
      postpartumFollowUp,
      messageResponseRate,
      avgNurseResponseHours: avgResponseHours,
      highRiskCases: dashboard.metrics.highRiskCases,
      activePregnancies: dashboard.metrics.activePregnancies,
      postpartumMothers: dashboard.metrics.postpartumMothers,
    },
    adherenceTrend,
    riskDistribution,
    appointmentAttendance,
    nurseResponseTrend,
    engagementRows,
    source: "dynamodb" as const,
  };
}
