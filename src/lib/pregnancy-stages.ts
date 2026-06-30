import type { PregnancyStage, PregnancyStageStatus } from "@/types/clinical.js";

export const PREGNANCY_STAGE_TEMPLATE: Omit<PregnancyStage, "status" | "currentWeek">[] = [
  {
    id: "conception",
    name: "Conception",
    weeks: "Week 1–4",
    goals: ["Confirm pregnancy", "Begin folic acid supplementation", "Avoid harmful substances"],
    changes: ["Implantation occurs", "Early hormonal shifts", "Possible missed period"],
    checkups: ["Confirmation blood test", "First consultation booking"],
    hospitalTasks: ["Enroll patient on Meds-inn", "Assign nurse and doctor", "Create initial care plan"],
    nurseTouchpoints: ["Welcome call within 48 hours", "Supplement education session"],
    education: ["Understanding your pregnancy test result", "What to avoid in early pregnancy"],
    medications: ["Folic Acid 400mcg daily"],
    warnings: ["Unusual bleeding", "Severe abdominal pain"],
    nextSteps: "Book first trimester visit between weeks 8–12.",
  },
  {
    id: "first-trimester",
    name: "First Trimester",
    weeks: "Week 5–13",
    goals: ["Establish care plan", "Confirm healthy development", "Manage early symptoms"],
    changes: ["Nausea and fatigue common", "Breast tenderness", "Frequent urination begins"],
    checkups: ["Booking visit (8–10 weeks)", "Dating scan (10–13 weeks)", "NT scan"],
    hospitalTasks: ["Complete booking history", "Order first bloods", "Schedule dating scan"],
    nurseTouchpoints: ["Booking visit follow-up call", "Nutrition and hydration check-in"],
    education: ["Managing morning sickness", "Safe foods during pregnancy", "When to call the clinic"],
    medications: ["Folic Acid 400mcg daily", "Vitamin D3 1000 IU daily"],
    warnings: ["Heavy bleeding", "Persistent vomiting", "One-sided pain (ectopic risk)"],
    nextSteps: "Prepare for second trimester anomaly scan at 18–20 weeks.",
  },
  {
    id: "second-trimester",
    name: "Second Trimester",
    weeks: "Week 14–27",
    goals: ["Monitor fetal growth", "Manage anaemia if present", "Prepare for glucose screening"],
    changes: ["Baby movements begin (18–20 weeks)", "Energy often improves", "Abdomen visibly grows", "Back pain may begin"],
    checkups: ["Anomaly scan (18–20 weeks)", "24-week review", "Glucose tolerance test (24–28 weeks)", "Full blood count"],
    hospitalTasks: ["Review anomaly scan results", "Order GTT if indicated", "Update risk assessment"],
    nurseTouchpoints: ["Mid-trimester check-in call", "Adherence review", "Birth plan introduction"],
    education: ["Understanding fetal movement", "Back care and safe exercise", "Preparing for the third trimester"],
    medications: ["Folic Acid 400mcg daily", "Ferrous Sulfate 200mg twice daily", "Calcium 500mg daily", "Vitamin D3 1000 IU daily"],
    warnings: ["Sudden swelling of face or hands", "Decreased fetal movement", "Severe headaches", "Vision changes"],
    nextSteps: "Schedule 28-week appointment and glucose tolerance test.",
  },
  {
    id: "third-trimester",
    name: "Third Trimester",
    weeks: "Week 28–36",
    goals: ["Finalize birth plan", "Monitor for complications", "Baby positions and presentation"],
    changes: ["Increased fetal movement", "Braxton Hicks contractions", "Shortness of breath", "Sleep becomes harder"],
    checkups: ["28-week review", "32-week scan", "36-week presentation check"],
    hospitalTasks: ["Confirm birth plan", "Review hospital admission criteria", "Schedule remaining visits"],
    nurseTouchpoints: ["Weekly check-in calls from 34 weeks", "Hospital tour coordination", "Postpartum plan introduction"],
    education: ["Signs of labour", "When to go to hospital", "Preparing your birth bag"],
    medications: ["Continue all current supplements", "Iron dose may increase if needed"],
    warnings: ["Reduced fetal movement", "Contractions before 37 weeks", "Vaginal bleeding", "Severe headache or vision changes"],
    nextSteps: "Prepare for delivery preparation stage from 37 weeks.",
  },
  {
    id: "delivery-prep",
    name: "Delivery Preparation",
    weeks: "Week 37–40",
    goals: ["Confirm delivery plan", "Manage anxiety and preparation", "Baby positioning monitoring"],
    changes: ["Baby drops lower", "Cervical changes begin", "Nesting instinct common"],
    checkups: ["Weekly visits from 37 weeks", "Cervical assessment", "NST if indicated"],
    hospitalTasks: ["Finalise delivery team assignment", "Confirm emergency contacts", "Prepare admission documentation"],
    nurseTouchpoints: ["Daily availability for questions", "Labour signs education session"],
    education: ["Understanding active labour", "Pain management options", "Partner support guidance"],
    medications: ["Continue supplements until delivery", "Discuss postnatal supplement plan"],
    warnings: ["Membrane rupture", "Regular painful contractions", "No fetal movement for 12 hours"],
    nextSteps: "Await labour onset or plan for induction as clinically indicated.",
  },
  {
    id: "delivery",
    name: "Delivery",
    weeks: "Birth Day",
    goals: ["Safe delivery", "Immediate newborn assessment", "Initiate breastfeeding"],
    changes: ["Active labour and birth", "Immediate skin-to-skin recommended", "Placental delivery"],
    checkups: ["APGAR score at 1 and 5 minutes", "Newborn weight and measurements", "Maternal post-delivery check"],
    hospitalTasks: ["Document delivery details in Meds-inn", "Create baby profile", "Initiate postpartum care plan"],
    nurseTouchpoints: ["Labour support throughout", "Immediate postpartum recovery check"],
    education: ["Immediate newborn care", "First hour after birth", "Breastfeeding initiation"],
    medications: ["Oxytocin per clinical protocol", "Postnatal iron continuation"],
    warnings: ["Excessive postpartum bleeding", "Baby not breathing at birth", "Signs of infection"],
    nextSteps: "Transition to postpartum recovery care within 24 hours.",
  },
  {
    id: "postpartum",
    name: "Postpartum Recovery",
    weeks: "Week 1–6 after birth",
    goals: ["Physical recovery", "Mental wellbeing support", "Breastfeeding establishment"],
    changes: ["Uterine involution", "Lochia discharge", "Breast milk production", "Emotional adjustment"],
    checkups: ["Day 1 postnatal check", "5-day midwife visit", "6-week GP/OB review"],
    hospitalTasks: ["Schedule 6-week review", "Assign postpartum nurse", "Monitor mental health indicators"],
    nurseTouchpoints: ["Day 3 home visit or call", "Weekly check-ins for 6 weeks", "Breastfeeding support call"],
    education: ["Normal postpartum recovery", "Signs of postpartum depression", "Contraception options"],
    medications: ["Continue iron if indicated", "Postnatal vitamins"],
    warnings: ["Heavy bleeding beyond day 10", "Signs of postnatal depression", "Wound infection signs", "Difficulty breastfeeding"],
    nextSteps: "Transition to baby's first-year care and paediatric follow-ups.",
  },
  {
    id: "baby-first-year",
    name: "Baby's First Year",
    weeks: "Month 1–12",
    goals: ["Vaccination schedule", "Growth monitoring", "Parent support"],
    changes: ["Rapid growth and development", "Sleep pattern changes", "Introduction of solids around 6 months"],
    checkups: ["8-week, 12-week, 16-week immunisations", "6-month review", "12-month review"],
    hospitalTasks: ["Activate baby profile", "Assign paediatrician", "Schedule vaccination reminders"],
    nurseTouchpoints: ["Postnatal calls for mother", "Vaccination adherence tracking"],
    education: ["Safe sleep guidance", "Feeding support", "Developmental milestones"],
    medications: ["Postnatal vitamins for mother", "Vitamin D for baby if indicated"],
    warnings: ["Fever in newborn", "Poor feeding", "Developmental concerns"],
    nextSteps: "Continue first-year paediatric follow-ups and milestone tracking.",
  },
];

const STAGE_ORDER = PREGNANCY_STAGE_TEMPLATE.map((s) => s.id);

function stageIndexForWeeks(gestationalWeek: number): number {
  if (gestationalWeek <= 4) return 0;
  if (gestationalWeek <= 13) return 1;
  if (gestationalWeek <= 27) return 2;
  if (gestationalWeek <= 36) return 3;
  if (gestationalWeek <= 40) return 4;
  return 5;
}

function stageIndexForPostpartum(babyWeeks: number): number {
  if (babyWeeks <= 6) return 6;
  return 7;
}

/** Apply mother progress onto the static stage template */
export function applyPregnancyProgress(params: {
  gestationalWeek?: number;
  careStage?: "pregnant" | "postpartum";
  babyWeeks?: number;
}): PregnancyStage[] {
  const careStage = params.careStage ?? "pregnant";
  const gestationalWeek = Number(params.gestationalWeek ?? 24);
  const babyWeeks = Number(params.babyWeeks ?? 0);

  const currentIdx =
    careStage === "postpartum"
      ? stageIndexForPostpartum(babyWeeks)
      : stageIndexForWeeks(gestationalWeek);

  return PREGNANCY_STAGE_TEMPLATE.map((stage, idx) => {
    let status: PregnancyStageStatus = "upcoming";
    if (idx < currentIdx) status = "completed";
    else if (idx === currentIdx) status = "current";

    const currentWeek =
      status === "current" && careStage === "pregnant" ? gestationalWeek : undefined;

    return { ...stage, status, ...(currentWeek !== undefined ? { currentWeek } : {}) };
  });
}

export { STAGE_ORDER };
