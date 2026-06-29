import type { CareBriefRecord } from "./care-brief-records";
import type { CareBriefContext } from "./care-brief-context";

const SYMPTOM_KEYWORDS = [
  "fatigue",
  "dizziness",
  "pain",
  "bleeding",
  "swelling",
  "headache",
  "nausea",
  "anxiety",
  "contractions",
  "fever",
  "movement",
];

function extractChatSymptoms(messages: CareBriefContext["recentMessages"]) {
  const found = new Set<string>();
  for (const msg of messages) {
    if (msg.role === "mother" || msg.role === "patient") {
      const lower = msg.text.toLowerCase();
      for (const kw of SYMPTOM_KEYWORDS) {
        if (lower.includes(kw)) found.add(kw);
      }
    }
  }
  return [...found];
}

function nurseLabel(ctx: CareBriefContext) {
  return ctx.mother.nurse && ctx.mother.nurse !== "To be assigned"
    ? ctx.mother.nurse
    : "assigned nurse";
}

function doctorLabel(ctx: CareBriefContext) {
  return ctx.mother.doctor && ctx.mother.doctor !== "To be assigned"
    ? ctx.mother.doctor
    : "assigned obstetrician";
}

function buildDataSources(ctx: CareBriefContext): CareBriefRecord["dataSources"] {
  const sources: CareBriefRecord["dataSources"] = [];

  sources.push({
    category: "Patient care record",
    detail: `Demographics, ${ctx.mother.gestationalWeek}-week gestational age, ${ctx.mother.riskLevel} risk classification, care stage, and assigned team (${nurseLabel(ctx)}; ${doctorLabel(ctx)}).`,
  });

  if ((ctx.mother.concerns ?? []).length > 0) {
    sources.push({
      category: "Documented clinical concerns",
      detail: `${ctx.mother.concerns!.length} concern(s) on file: ${ctx.mother.concerns!.slice(0, 4).join("; ")}.`,
    });
  }

  if (ctx.medications.length > 0) {
    const names = ctx.medications.map((m) => m.name).join(", ");
    sources.push({
      category: "Medication records",
      detail: `${ctx.medications.length} active prescription(s) (${names}); adherence derived from reminder logs and dose completion.`,
    });
  } else {
    sources.push({
      category: "Medication records",
      detail: "No active prescribed medications on file at time of generation.",
    });
  }

  sources.push({
    category: "Appointment history",
    detail: `Scheduled, completed, and missed visits; ${ctx.missedLast30} missed in the last 30 days; appointment adherence ${ctx.appointmentAdherence}%.`,
  });

  if (ctx.recentMessages.length > 0) {
    const motherMsgs = ctx.recentMessages.filter(
      (m) => m.role === "mother" || m.role === "patient",
    ).length;
    sources.push({
      category: "Secure messaging",
      detail: `${ctx.recentMessages.length} recent message(s) in threads with ${nurseLabel(ctx)} and care team; ${motherMsgs} from patient.`,
    });
  } else {
    sources.push({
      category: "Secure messaging",
      detail: "No recent secure messages in the last review window.",
    });
  }

  if (ctx.hasActiveChecklist) {
    sources.push({
      category: "Daily care checklist",
      detail: `${ctx.dailyTaskCount} assigned daily task(s); adherence ${ctx.checklistAdherence ?? "—"}%${ctx.abscondedYesterday.length > 0 ? `; ${ctx.abscondedYesterday.length} task(s) missed yesterday` : ""}.`,
    });
  }

  if ((ctx.symptoms ?? []).length > 0) {
    const recent = ctx.symptoms!.slice(0, 5).map((s) => `${s.symptom} (${s.severity}, ${s.date})`);
    sources.push({
      category: "Patient symptom log",
      detail: `${ctx.symptoms!.length} logged symptom(s); recent: ${recent.join("; ")}.`,
    });
  }

  if (ctx.babyProfile?.babyName) {
    sources.push({
      category: "Baby profile",
      detail: `${ctx.babyProfile.babyName}, born ${ctx.babyProfile.birthDate || "—"}, ${ctx.babyWeeks ?? 0} weeks old; feeding: ${ctx.babyProfile.feedingMethod || "—"}; blood group ${ctx.babyProfile.bloodGroup || "—"}.`,
    });
  }

  if ((ctx.babySymptoms ?? []).length > 0) {
    const recent = ctx.babySymptoms!.slice(0, 4).map((s) => `${s.symptom} (${s.severity})`);
    sources.push({
      category: "Baby symptom log",
      detail: `Recent baby symptoms: ${recent.join("; ")}.`,
    });
  }

  if ((ctx.babyMedications ?? []).length > 0) {
    sources.push({
      category: "Baby medications",
      detail: `${ctx.babyMedications!.map((m) => `${m.name} ${m.dosage}`).join("; ")}.`,
    });
  }

  if (ctx.babyChecklistTotal > 0) {
    sources.push({
      category: "Baby daily care checklist",
      detail: `${ctx.babyChecklistDone}/${ctx.babyChecklistTotal} baby care tasks completed today.`,
    });
  }

  if (String(ctx.mother.escalationStatus ?? "") === "open") {
    sources.push({
      category: "Case escalation",
      detail: `${ctx.mother.escalationSeverity ?? "serious"} escalation on file (${ctx.mother.escalationAt ?? "recent"}): ${String(ctx.mother.escalationNote ?? "").slice(0, 120)}`,
    });
  }

  return sources;
}

export function generateCareBriefFromContext(
  ctx: CareBriefContext,
  _generatedBy?: string,
): CareBriefRecord {
  const m = ctx.mother;
  const isPostpartum =
    m.status === "postpartum" || m.status === "delivered" || m.careStage === "postpartum";
  const dataSources = buildDataSources(ctx);
  const riskCues: string[] = [];
  const nurse = nurseLabel(ctx);

  if (m.riskLevel === "high") {
    riskCues.push(
      "According to the patient care record, this patient is classified as high risk and warrants enhanced monitoring.",
    );
  } else if (m.riskLevel === "moderate") {
    riskCues.push(
      "According to the patient care record, moderate risk classification applies — continue close surveillance.",
    );
  }

  for (const c of ctx.concerns.slice(0, 3)) {
    riskCues.push(`According to documented clinical concerns on file: ${c}.`);
  }

  if (ctx.missedLast30 > 0) {
    riskCues.push(
      `According to appointment records, ${ctx.missedLast30} visit${ctx.missedLast30 !== 1 ? "s were" : " was"} missed in the last 30 days.`,
    );
  }

  if (ctx.medAdherence < 70) {
    riskCues.push(
      `According to medication records, adherence is ${ctx.medAdherence}% — below the 70% clinical threshold.`,
    );
  }

  if (ctx.checklistAdherence !== null && ctx.checklistAdherence < 70) {
    riskCues.push(
      `According to the daily care checklist, completion is ${ctx.checklistAdherence}% — below target.`,
    );
  }

  for (const item of ctx.abscondedYesterday.slice(0, 2)) {
    riskCues.push(
      `According to yesterday's daily care checklist, the following task was not completed: ${item}.`,
    );
  }

  for (const s of (ctx.symptoms ?? []).slice(0, 5)) {
    riskCues.push(
      `According to the patient symptom log (${s.date}, ${s.severity}): ${s.symptom}${s.notes ? ` — ${s.notes}` : ""}.`,
    );
  }

  const chatSymptoms = extractChatSymptoms(ctx.recentMessages);
  for (const s of chatSymptoms.slice(0, 2)) {
    riskCues.push(
      `According to secure messaging with ${nurse}, the patient recently reported ${s}.`,
    );
  }

  for (const msg of ctx.recentMessages.filter((x) => x.urgent).slice(0, 2)) {
    riskCues.push(
      `According to secure messaging flagged as urgent from ${msg.from}: "${msg.text.slice(0, 100)}${msg.text.length > 100 ? "…" : ""}"`,
    );
  }

  if (m.status === "missed-followup") {
    riskCues.push(
      "According to the patient care record, follow-up status is marked as missed.",
    );
  }

  if (String(m.escalationStatus ?? "") === "open" && m.escalationNote) {
    const targets = Array.isArray(m.escalationTargets)
      ? (m.escalationTargets as string[]).join(", ")
      : "care team";
    riskCues.push(
      `Open case escalation (${m.escalationSeverity ?? "serious"}) to ${targets} by ${m.escalationBy ?? "clinical staff"}: ${String(m.escalationNote).slice(0, 160)}`,
    );
  }

  if (riskCues.length === 0) {
    riskCues.push(
      "According to aggregated clinical data, no urgent risk cues were identified at the time of generation.",
    );
  }

  const suggestedFollowups: string[] = [];

  if (ctx.missedLast30 > 0) {
    suggestedFollowups.push("Contact patient to reschedule missed visit(s) within 48 hours");
  }
  if (ctx.medAdherence < 85) {
    suggestedFollowups.push("Review medication adherence barriers and reinforce dosing schedule");
  }
  if (ctx.checklistAdherence !== null && ctx.checklistAdherence < 85) {
    suggestedFollowups.push("Discuss daily care checklist completion and remove barriers");
  }
  if (m.riskLevel === "high") {
    suggestedFollowups.push(`Escalate to ${doctorLabel(ctx)} for high-risk review`);
  }
  if (m.gestationalWeek >= 24 && m.gestationalWeek <= 28 && !isPostpartum) {
    suggestedFollowups.push("Confirm glucose tolerance test scheduled before 28-week visit");
  }
  if (isPostpartum && !ctx.babyProfile?.babyName) {
    suggestedFollowups.push("Prompt mother to complete baby profile in Baby Care");
  }
  if (isPostpartum && (ctx.babySymptoms ?? []).some((s) => s.severity === "severe")) {
    suggestedFollowups.push("Review severe baby symptoms logged by mother");
  }
  if (ctx.upcomingAppointments.length > 0) {
    const next = ctx.upcomingAppointments[0];
    suggestedFollowups.push(
      `Prepare for upcoming ${next.type} on ${next.date} with ${next.clinician}`,
    );
  } else if (!isPostpartum) {
    suggestedFollowups.push("Confirm next antenatal appointment is booked");
  }
  const loggedSymptomText = (ctx.symptoms ?? []).map((s) => s.symptom.toLowerCase()).join(" ");
  if (loggedSymptomText.includes("dizziness") || loggedSymptomText.includes("fatigue")) {
    suggestedFollowups.push("Nurse call within 48 hours to assess dizziness/fatigue symptoms");
  }

  const uniqueFollowups = [...new Set(suggestedFollowups)].slice(0, 5);

  const trimester = m.trimester?.toLowerCase() ?? "current";
  const careStage = isPostpartum
    ? `postpartum period (baby week ${ctx.babyWeeks ?? 0})`
    : `${m.gestationalWeek}-week ${trimester} trimester pregnancy`;

  const medList =
    ctx.medications.length > 0
      ? ctx.medications.map((med) => `${med.name} (${med.adherence}% adherence)`).join("; ")
      : "no active prescribed medications on record";

  const paragraph1 = [
    `${m.name} (${m.id}) is in the ${careStage}.`,
    `According to the patient care record, she is classified as ${m.riskLevel} risk.`,
    `Assigned care team: ${nurse} (nurse) and ${doctorLabel(ctx)} (doctor).`,
  ].join(" ");

  const paragraph2 = [
    `According to medication records, current medication adherence is ${ctx.medAdherence}%`,
    ctx.medications.length > 0 ? ` across ${ctx.medications.length} active prescription(s): ${medList}.` : ".",
    `According to appointment records, appointment adherence is ${ctx.appointmentAdherence}%`,
    ctx.missedLast30 > 0
      ? ` with ${ctx.missedLast30} missed visit(s) in the last 30 days.`
      : " with satisfactory recent attendance.",
  ].join("");

  const paragraph3Parts: string[] = [];
  if (ctx.hasActiveChecklist) {
    paragraph3Parts.push(
      `According to the daily care checklist, she has ${ctx.dailyTaskCount} assigned task(s) with ${ctx.checklistAdherence ?? "—"}% completion.`,
    );
  }
  if (ctx.recentMessages.length > 0) {
    paragraph3Parts.push(
      `According to secure messaging with ${nurse}, ${ctx.recentMessages.length} recent message(s) were reviewed; the latest correspondence is from ${ctx.recentMessages[0].from}.`,
    );
  }
  if ((m.concerns ?? []).length > 0) {
    paragraph3Parts.push(
      `Documented concerns on file include: ${(m.concerns ?? []).slice(0, 3).join("; ")}.`,
    );
  }
  if ((ctx.symptoms ?? []).length > 0) {
    const recent = ctx.symptoms!.slice(0, 3).map((s) => `${s.symptom} (${s.severity})`);
    paragraph3Parts.push(
      `According to the patient symptom log, recent entries include: ${recent.join("; ")}.`,
    );
  }
  if ((ctx.completedVisitNotes ?? []).length > 0) {
    const notes = ctx.completedVisitNotes!
      .filter((v) => v.note && v.note !== "empty")
      .slice(0, 3)
      .map((v) => `${v.type} on ${v.date} (${v.clinician}): ${v.note}`);
    if (notes.length > 0) {
      paragraph3Parts.push(
        `According to confirmed in-person visit records: ${notes.join("; ")}.`,
      );
    }
  }
  if (ctx.babyProfile?.babyName) {
    const bp = ctx.babyProfile;
    paragraph3Parts.push(
      `According to the baby profile, ${bp.babyName} was born ${bp.birthDate || "—"} (${ctx.babyWeeks ?? 0} weeks old); birth weight ${bp.birthWeight || "not recorded"}; feeding method ${bp.feedingMethod || "not specified"}.`,
    );
  }
  if ((ctx.babySymptoms ?? []).length > 0) {
    const recent = ctx.babySymptoms!.slice(0, 3).map((s) => `${s.symptom} (${s.severity})`);
    paragraph3Parts.push(
      `According to the baby symptom log, recent entries: ${recent.join("; ")}.`,
    );
  }
  if ((ctx.babyMedications ?? []).length > 0) {
    paragraph3Parts.push(
      `Baby medications on file: ${ctx.babyMedications!.map((med) => med.name).join(", ")}.`,
    );
  }
  if (ctx.babyChecklistTotal > 0) {
    paragraph3Parts.push(
      `Today's baby care checklist: ${ctx.babyChecklistDone}/${ctx.babyChecklistTotal} tasks completed.`,
    );
  }
  const paragraph3 = paragraph3Parts.join(" ") || "No additional checklist or messaging signals require immediate attention.";

  const paragraph4 = `Clinical recommendation: ${uniqueFollowups[0] ?? "Continue current care plan with routine monitoring."} This brief is advisory only and requires clinician review before any action is taken.`;

  const summary = [paragraph1, paragraph2, paragraph3, paragraph4].join("\n\n");

  const id = `brief-${m.id}-${Date.now()}`;

  return {
    id,
    motherId: m.id,
    motherName: m.name,
    generatedAt: new Date().toISOString(),
    reviewed: false,
    summary,
    dataSources,
    riskCues: [...new Set(riskCues)].slice(0, 10),
    adherenceSummary: {
      medication: ctx.medAdherence,
      appointment: ctx.appointmentAdherence,
      checklist: ctx.checklistAdherence,
      missedVisits: ctx.missedLast30,
    },
    suggestedFollowups: uniqueFollowups,
  };
}
