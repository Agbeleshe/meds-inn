import { getMotherRecordResolved } from "./mothers";
import { listAppointmentRecords, applyMissedStatus } from "./appointment-records";
import { listMedicationRecords } from "./medication-records";
import { getCarePlanRecord } from "./care-plans";
import { processDailyChecklist } from "./checklist-daily";
import { listChatThreadRecords, listChatMessageRecords } from "./chat-records";
import { listSymptomRecords } from "./symptom-records";
import {
  getBabyProfileRecord,
  listBabySymptomRecords,
  listBabyMedicationRecords,
  getBabyChecklistDay,
  babyWeeksFromBirthDate,
} from "./baby-records";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export async function gatherCareBriefContext(motherId: string, hospitalId = "ELR") {
  const mother = await getMotherRecordResolved(motherId);
  if (!mother) return null;

  let appointments = applyMissedStatus(await listAppointmentRecords(hospitalId));
  appointments = appointments.filter((a) => a.patientId === motherId);

  const medications = (await listMedicationRecords(hospitalId)).filter(
    (m) => m.patientId === motherId && m.active !== false,
  );

  const medAdherence =
    medications.length > 0
      ? avg(medications.map((m) => Number(m.adherence ?? 0)))
      : Number(mother.adherence ?? 0);

  const completed = appointments.filter((a) => a.status === "completed");
  const missed = appointments.filter((a) => a.status === "missed");
  const apptRelevant = completed.length + missed.length;
  const appointmentAdherence =
    apptRelevant > 0 ? Math.round((completed.length / apptRelevant) * 100) : 100;

  const since30 = daysAgo(30);
  const missedLast30 = appointments.filter(
    (a) => a.status === "missed" && a.date >= since30,
  );

  const upcoming = appointments
    .filter((a) => a.status === "scheduled" && a.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const plan = await getCarePlanRecord(motherId);
  let checklistAdherence: number | null = null;
  let abscondedYesterday: string[] = [];
  let dailyTaskCount = 0;

  if (plan?.dailyChecklist) {
    const processed = await processDailyChecklist(
      motherId,
      plan.dailyChecklist as Parameters<typeof processDailyChecklist>[1],
    );
    checklistAdherence = processed.adherence?.adherencePercent ?? null;
    dailyTaskCount = plan.dailyChecklist.items?.length ?? 0;
    const yesterday = processed.yesterdaySummary;
    if (yesterday?.abscondedItems?.length) {
      abscondedYesterday = yesterday.abscondedItems.map((i) => i.text);
    }
  }

  const threads = (await listChatThreadRecords(hospitalId)).filter(
    (t) => t.patientId === motherId,
  );

  const recentMessages: Array<{
    from: string;
    role: string;
    text: string;
    at: string;
    urgent?: boolean;
  }> = [];

  for (const thread of threads.slice(0, 3)) {
    const messages = await listChatMessageRecords(thread.id);
    for (const msg of messages.filter((m) => !m.deleted).slice(-8)) {
      recentMessages.push({
        from: msg.senderName,
        role: msg.senderRole,
        text: msg.text,
        at: msg.createdAt,
        urgent: msg.urgent,
      });
    }
  }

  recentMessages.sort((a, b) => b.at.localeCompare(a.at));

  const symptoms = await listSymptomRecords(motherId);
  const recentSymptoms = symptoms.slice(0, 20);

  const babyProfile = await getBabyProfileRecord(motherId);
  const babySymptoms = await listBabySymptomRecords(motherId);
  const babyMedications = await listBabyMedicationRecords(motherId);
  const babyChecklistDay = await getBabyChecklistDay(motherId);
  const babyChecklistDone = babyChecklistDay.completedItemIds.length;
  const babyChecklistTotal = babyChecklistDay.items.length;
  const babyWeeks =
    mother.babyWeeks ??
    (babyProfile?.birthDate ? babyWeeksFromBirthDate(babyProfile.birthDate) : 0);

  return {
    mother,
    babyProfile,
    babyWeeks,
    babySymptoms: babySymptoms.slice(0, 10),
    babyMedications,
    babyChecklistDone,
    babyChecklistTotal,
    medAdherence,
    appointmentAdherence,
    checklistAdherence,
    missedLast30: missedLast30.length,
    missedAppointmentDetails: missedLast30.map((a) => ({
      date: a.date,
      type: a.type,
      clinician: a.clinician,
    })),
    upcomingAppointments: upcoming,
    completedVisitNotes: completed
      .filter((a) => a.clinicianConfirmed)
      .slice(0, 5)
      .map((a) => ({
        date: a.date,
        type: a.type,
        clinician: a.clinician,
        note: a.attendanceNote?.trim() || "empty",
        confirmedBy: a.confirmedBy,
      })),
    medications: medications.map((m) => ({
      name: m.name,
      dosage: m.dosage,
      adherence: Number(m.adherence ?? 0),
      missedDoses: Number(m.missedDoses ?? 0),
    })),
    concerns: mother.concerns ?? [],
    symptoms: recentSymptoms.map((s) => ({
      date: s.date,
      symptom: s.symptom,
      severity: s.severity,
      notes: s.notes,
    })),
    dailyTaskCount,
    abscondedYesterday,
    recentMessages: recentMessages.slice(0, 12),
    hasActiveChecklist: Boolean(plan?.dailyChecklist),
  };
}

export type CareBriefContext = NonNullable<Awaited<ReturnType<typeof gatherCareBriefContext>>>;
