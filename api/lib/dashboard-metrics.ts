import { filterMothersForRole, filterAppointmentsForRole } from "../../src/lib/assignments";
import { listMotherRecordsFast } from "./mothers";
import { listAppointmentRecords, applyMissedStatus } from "./appointment-records";
import { listMedicationRecords } from "./medication-records";
import { listNotifications } from "./notifications";
import { withTimeout } from "./fast-fallback";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb, TABLE_NAME, ENTITY_PREFIX, stripKeys } from "./dynamodb";
import { prefixFilter } from "./items";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function medicationAdherenceForPatient(
  patientId: string,
  medications: Array<{ patientId: string; active?: boolean; adherence?: number }>,
) {
  const meds = medications.filter(
    (m) => m.patientId === patientId && m.active !== false,
  );
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
  const completed = relevant.filter((a) => a.status === "completed").length;
  return Math.round((completed / relevant.length) * 100);
}

export async function buildDashboardMetrics(
  user: Record<string, unknown>,
  hospitalId: string,
) {
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

  let appointments = await listAppointmentRecords(hospitalId);
  appointments = applyMissedStatus(appointments);

  const motherRefs = allMothers.map((m) => ({
    id: m.id,
    assignedNurseUserId: m.assignedNurseUserId,
    assignedDoctorUserId: m.assignedDoctorUserId,
  }));

  appointments = filterAppointmentsForRole(appointments, userRef, motherRefs).filter(
    (a) => role === "admin" || motherIds.has(a.patientId),
  );

  const allMedications = await withTimeout(listMedicationRecords(hospitalId), 2500, []);
  const medications = allMedications.filter(
    (m) => role === "admin" || motherIds.has(m.patientId),
  );

  let team: Record<string, unknown>[] = [];
  try {
    const teamRes = await withTimeout(
      dynamodb.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          Limit: 50,
          ...prefixFilter(ENTITY_PREFIX.team),
        }),
      ),
      2000,
      { Items: [] } as any,
    );
    team = (teamRes.Items ?? [])
      .map((item) => stripKeys(item as Record<string, unknown>))
      .filter((t) => String(t.hospitalId ?? "ELR") === hospitalId);
  } catch {
    team = [];
  }

  const today = todayIso();
  const highRisk = mothers.filter((m) => m.riskLevel === "high").length;
  const postpartum = mothers.filter((m) => m.status === "postpartum").length;
  const activePregnancy = mothers.filter((m) => m.status === "active-pregnancy").length;
  const missedFollowUp = mothers.filter(
    (m) => m.status === "missed-followup" || Number(m.adherence ?? 100) < 70,
  ).length;

  const todayAppointments = appointments.filter(
    (a) => a.date === today && a.status === "scheduled",
  ).length;

  const medAdherenceValues = mothers.map((m) => {
    const fromMeds = medicationAdherenceForPatient(m.id, medications);
    return fromMeds ?? Number(m.adherence ?? 0);
  });
  const medicationAdherence = avg(medAdherenceValues);

  const apptAdherenceValues = mothers
    .map((m) => appointmentAdherenceForPatient(m.id, appointments))
    .filter((v): v is number => v !== null);
  const appointmentAdherence = apptAdherenceValues.length > 0 ? avg(apptAdherenceValues) : 100;

  const assignedPatients = mothers.map((m) => {
    const medAdh = medicationAdherenceForPatient(m.id, medications);
    const apptAdh = appointmentAdherenceForPatient(m.id, appointments);
    const combined =
      medAdh !== null && apptAdh !== null
        ? Math.round((medAdh + apptAdh) / 2)
        : medAdh ?? apptAdh ?? Number(m.adherence ?? 0);

    return {
      id: m.id,
      name: m.name,
      initials: m.initials,
      gestationalWeek: m.gestationalWeek,
      riskLevel: m.riskLevel,
      status: m.status,
      lastCheckIn: m.lastCheckIn,
      adherence: combined,
      medicationAdherence: medAdh ?? Number(m.adherence ?? 0),
      appointmentAdherence: apptAdh,
      nextAppointment: m.nextAppointment,
    };
  });

  const needFollowUp = [...assignedPatients]
    .filter(
      (p) =>
        p.riskLevel === "high" ||
        p.adherence < 70 ||
        p.status === "missed-followup",
    )
    .sort((a, b) => a.adherence - b.adherence)
    .slice(0, 8);

  const upcomingAppointments = appointments
    .filter((a) => a.status === "scheduled" && a.date >= today)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 6);

  const recentAlerts: Array<{
    patient: string;
    patientId: string;
    note: string;
    severity: "high" | "medium" | "low";
    time: string;
  }> = [];

  for (const p of assignedPatients) {
    if (p.riskLevel === "high") {
      recentAlerts.push({
        patient: p.name,
        patientId: p.id,
        note: "High-risk patient — review care plan and upcoming appointments.",
        severity: "high",
        time: "Today",
      });
    }
    if (p.adherence < 70) {
      recentAlerts.push({
        patient: p.name,
        patientId: p.id,
        note: `Medication adherence at ${p.medicationAdherence}% — follow up recommended.`,
        severity: "medium",
        time: "Recent",
      });
    }
    if (p.status === "missed-followup") {
      recentAlerts.push({
        patient: p.name,
        patientId: p.id,
        note: "Marked as missed follow-up — contact patient.",
        severity: "medium",
        time: "Recent",
      });
    }
  }

  for (const a of appointments.filter((x) => x.status === "missed").slice(0, 3)) {
    recentAlerts.push({
      patient: a.patient,
      patientId: a.patientId,
      note: `Missed appointment on ${a.date} (${a.type}).`,
      severity: "medium",
      time: a.date,
    });
  }

  try {
    const notifications = await listNotifications(String(user.id));
    for (const n of notifications.filter((x) => !x.read).slice(0, 3)) {
      recentAlerts.push({
        patient: String(n.title),
        patientId: String(n.motherId ?? ""),
        note: String(n.body),
        severity: n.type === "specialist-request" ? "high" : "low",
        time: new Date(String(n.createdAt)).toLocaleDateString(),
      });
    }
  } catch {
    /* optional */
  }

  const dedupedAlerts = recentAlerts.slice(0, 6);

  const scope = role === "admin" ? "hospital" : "assigned";

  return {
    scope,
    metrics: {
      totalMothers: mothers.length,
      activePregnancies: activePregnancy,
      highRiskCases: highRisk,
      todayAppointments,
      missedFollowUps: missedFollowUp,
      postpartumMothers: postpartum,
      medicationAdherence,
      appointmentAdherence,
      careContinuityScore: Math.min(
        100,
        Math.round(medicationAdherence * 0.6 + appointmentAdherence * 0.4),
      ),
      teamMembers: role === "admin" ? team.length : mothers.length,
    },
    assignedPatients: assignedPatients.sort((a, b) => a.adherence - b.adherence),
    needFollowUp,
    upcomingAppointments,
    teamSnapshot: team.slice(0, 4),
    recentAlerts: dedupedAlerts,
    source: "dynamodb" as const,
  };
}
