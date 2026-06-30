import type { CarePlan, CarePlanSection, MotherChecklistItem } from "@/types/clinical.js";

/** Serializable care plan sections (stored in DynamoDB, no React icons) */
export const DEFAULT_CARE_PLAN_SECTIONS: CarePlanSection[] = [
  {
    id: "trimester-goals",
    iconId: "heart",
    title: "Second Trimester Goals",
    reviewedBy: "Dr. Tolu Adebayo",
    reviewDate: "2026-06-20",
    items: [
      { label: "Attend 20-week anomaly scan", done: true, note: "Completed June 1. No anomalies detected." },
      { label: "Complete glucose tolerance test (24–28 weeks)", done: false, note: "Scheduled — to be completed by July 15." },
      { label: "Review haemoglobin at 24-week visit", done: true, note: "Hb 10.8 g/dL. Iron continued." },
      { label: "Discuss birth plan preferences", done: false },
    ],
  },
  {
    id: "nutrition",
    iconId: "apple",
    title: "Nutrition Guidance",
    reviewedBy: "Nurse Esther Okonkwo",
    reviewDate: "2026-06-18",
    items: [
      { label: "Iron-rich foods daily (leafy greens, beans, lean meat)", done: true },
      { label: "Calcium-rich foods (dairy, fortified plant milk)", done: true },
      { label: "Avoid raw fish, unpasteurised dairy, deli meats", done: true },
      { label: "Small, frequent meals to manage nausea and acidity", done: false },
      { label: "Limit caffeine to under 200mg/day", done: true },
    ],
  },
  {
    id: "hydration",
    iconId: "droplets",
    title: "Hydration Goals",
    reviewedBy: "Nurse Esther Okonkwo",
    reviewDate: "2026-06-18",
    items: [
      { label: "Drink at least 8–10 glasses of water daily", done: false, note: "Patient reported difficulty reaching this target." },
      { label: "Limit sugary drinks and sodas", done: true },
      { label: "Hydration tracker activated in app", done: true },
    ],
  },
  {
    id: "supplements",
    iconId: "pill",
    title: "Supplements",
    reviewedBy: "Dr. Tolu Adebayo",
    reviewDate: "2026-06-20",
    items: [
      { label: "Folic Acid 400mcg — once daily (morning)", done: true },
      { label: "Ferrous Sulfate 200mg — twice daily (with meals)", done: true },
      { label: "Calcium Carbonate 500mg — once daily (evening)", done: true },
      { label: "Vitamin D3 1000 IU — once daily (with fatty meal)", done: true },
    ],
  },
  {
    id: "appointments",
    iconId: "calendar",
    title: "Appointment Schedule",
    reviewedBy: "Dr. Tolu Adebayo",
    reviewDate: "2026-06-20",
    items: [
      { label: "12-week booking visit", done: true },
      { label: "20-week anomaly scan", done: true },
      { label: "24-week routine review", done: true },
      { label: "Glucose tolerance test (24–28 weeks)", done: false },
      { label: "28-week review and blood count", done: false },
      { label: "32-week growth scan", done: false },
      { label: "36-week presentation check", done: false },
    ],
  },
  {
    id: "counselling",
    iconId: "book-open",
    title: "Counselling & Education Tasks",
    reviewedBy: "Nurse Esther Okonkwo",
    reviewDate: "2026-06-18",
    items: [
      { label: "Labour and delivery education session", done: false, note: "Scheduled for 30-week visit." },
      { label: "Breastfeeding preparation session", done: false },
      { label: "Mental health wellbeing check-in completed", done: true },
      { label: "Partner included in care plan discussion", done: true },
    ],
  },
  {
    id: "risk",
    iconId: "shield-alert",
    title: "Risk Monitoring",
    reviewedBy: "Dr. Tolu Adebayo",
    reviewDate: "2026-06-20",
    items: [
      { label: "Blood pressure checked at every visit", done: true },
      { label: "Anaemia — monitor haemoglobin at 28 weeks", done: false },
      { label: "Symptom log reviewed by nurse weekly", done: true },
      { label: "Dizziness and fatigue — active monitoring", done: false, note: "Nurse follow-up call to be completed." },
    ],
  },
  {
    id: "postpartum",
    iconId: "heart",
    title: "Postpartum Plan",
    reviewedBy: "Dr. Tolu Adebayo",
    reviewDate: "2026-06-20",
    items: [
      { label: "6-week postpartum review booked (Dr. Ifeoma Nnaji)", done: false },
      { label: "Mental health screening included at 6-week visit", done: false },
      { label: "Breastfeeding support line shared", done: true },
      { label: "Contraception options discussed post-delivery", done: false },
    ],
  },
  {
    id: "baby-prep",
    iconId: "baby",
    title: "Baby Care Preparation",
    reviewedBy: "Nurse Esther Okonkwo",
    reviewDate: "2026-06-18",
    items: [
      { label: "Baby profile created on Meds-inn", done: false, note: "Will activate post-delivery." },
      { label: "First-year vaccination schedule prepared", done: true },
      { label: "Paediatric assignment — Dr. Ifeoma Nnaji", done: true },
      { label: "Hospital tour scheduled", done: false },
      { label: "Emergency contact form completed", done: true },
    ],
  },
];

export function buildDefaultCarePlan(motherId: string): CarePlan {
  return {
    motherId,
    sections: DEFAULT_CARE_PLAN_SECTIONS,
    motherChecklist: DEFAULT_MOTHER_CHECKLIST,
    education: DEFAULT_CARE_EDUCATION,
    updatedAt: new Date().toISOString(),
  };
}

export const DEFAULT_MOTHER_CHECKLIST = [
  { id: "mc1", text: "Log today's symptoms", done: false, setBy: "Care team", setAt: "2026-06-18" },
  { id: "mc2", text: "Morning medication taken", done: false, setBy: "Care team", setAt: "2026-06-18" },
  { id: "mc3", text: "Drink 8 glasses of water today", done: false, setBy: "Nurse Elena Costa", setAt: "2026-06-20" },
  { id: "mc4", text: "Take evening medications", done: false, setBy: "Care team", setAt: "2026-06-18" },
  { id: "mc5", text: "Log fetal movement (10 kicks by 10 PM)", done: false, setBy: "Dr. Priya Sharma", setAt: "2026-06-20" },
];

export const DEFAULT_CARE_EDUCATION = [
  {
    id: "ed1",
    title: "Understanding fetal movement",
    body: "At 24 weeks, your baby's movements will become more regular. You may feel kicks, rolls, or stretches. Track at least 10 movements within 2 hours each evening.",
  },
  {
    id: "ed2",
    title: "Managing back discomfort",
    body: "Back pain is common in the second trimester as your posture changes. Sleep on your left side with a pillow between your knees.",
  },
  {
    id: "ed3",
    title: "Preparing for your glucose test",
    body: "Your glucose tolerance test (GTT) is due between weeks 24 and 28. Fast for 8 hours beforehand.",
  },
];
