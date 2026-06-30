import type { WeekEducation } from "./pregnancy-week-education.js";

/** Newborn & first-year education anchors (weeks 0–52). */
const BABY_WEEK_ANCHORS = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52] as const;

const BABY_CONTENT: Record<number, Omit<WeekEducation, "week" | "trimester">> = {
  0: {
    title: "Welcome home — first days",
    summary: "Your newborn is adjusting to life outside the womb. Rest, feeding, and gentle bonding are the priorities.",
    tips: [
      "Skin-to-skin contact helps regulate baby's temperature and supports breastfeeding.",
      "Newborns sleep 14–17 hours a day in short stretches — rest when they rest.",
      "Watch for 6+ wet nappies per day by day 5 as a feeding sign.",
      "Accept help with meals and household tasks so you can recover.",
    ],
    nutrition: ["Warm nourishing meals", "Plenty of fluids", "Iron-rich foods if anaemic", "One-handed snacks"],
    warningSigns: ["Fever over 38°C", "Fewer than 3 wet nappies in 24 hours after day 3", "Yellow skin worsening"],
    forCareTeam: ["Schedule newborn check within 48–72 hours.", "Review feeding and weight.", "Screen for jaundice."],
  },
  4: {
    title: "Week 4 — settling in",
    summary: "Feeding patterns emerge and your baby may start focusing on faces and voices.",
    tips: [
      "Tummy time for a few minutes while awake builds neck strength.",
      "Talk and sing — babies love familiar voices from the womb.",
      "Establish a gentle bedtime routine even if sleep is irregular.",
      "Track wet and dirty nappies to confirm adequate intake.",
    ],
    nutrition: ["Continue balanced meals if breastfeeding", "Vitamin D for baby per clinician advice", "Stay hydrated"],
    warningSigns: ["Persistent crying with fever", "Poor feeding or lethargy", "Breathing difficulty"],
    forCareTeam: ["Weigh baby and plot growth.", "Discuss feeding challenges.", "Review maternal recovery."],
  },
  8: {
    title: "Week 8 — social smiles",
    summary: "Many babies begin social smiling. Sleep may still be fragmented — this is normal.",
    tips: [
      "Respond to coos and smiles — early communication matters.",
      "Continue safe sleep: on back, firm surface, no loose bedding.",
      "Short outings are fine; avoid crowded places if unwell.",
      "Watch for postnatal mood changes — seek support early.",
    ],
    nutrition: ["Omega-3 rich foods support recovery", "Calcium for bone health", "Regular meals"],
    warningSigns: ["No social response by 8 weeks", "Excessive vomiting", "Rash with fever"],
    forCareTeam: ["8-week immunisations per local schedule.", "Developmental check.", "Maternal mental health screen."],
  },
  12: {
    title: "Week 12 — three months",
    summary: "Head control improves and babies become more alert and interactive.",
    tips: [
      "Increase supervised tummy time gradually.",
      "Introduce high-contrast books and gentle play.",
      "Maintain consistent feeding — growth spurts are common.",
      "Baby-proof ahead as rolling approaches.",
    ],
    nutrition: ["Varied diet supports energy for parenting", "Iron if breastfeeding long-term", "Hydration"],
    warningSigns: ["No head control", "No eye contact", "Feeding refusal"],
    forCareTeam: ["12-week vaccinations.", "Growth review.", "Discuss return to work if applicable."],
  },
  16: {
    title: "Week 16 — discovering the world",
    summary: "Rolling may begin. Babies reach for objects and enjoy varied sounds.",
    tips: [
      "Never leave baby unattended on elevated surfaces.",
      "Offer safe teethers if drooling increases.",
      "Maintain nap routines amid new mobility.",
      "Continue reading aloud daily.",
    ],
    nutrition: ["Protein at each meal", "Fibre for digestive health", "Limit caffeine if breastfeeding"],
    warningSigns: ["Asymmetric movement", "No vocalisation", "Persistent irritability"],
    forCareTeam: ["16-week immunisations.", "Motor milestone check.", "Safe sleep reinforcement."],
  },
  24: {
    title: "Week 24 — six months",
    summary: "Many babies are ready for complementary foods alongside milk. Sitting with support is common.",
    tips: [
      "Introduce iron-rich first foods when clinician advises.",
      "Offer water in a cup with meals once solids begin.",
      "Baby-proof cabinets and cords as mobility increases.",
      "Maintain milk feeds as primary nutrition initially.",
    ],
    nutrition: ["Iron-fortified cereals", "Soft mashed vegetables", "Continue maternal balanced diet"],
    warningSigns: ["No sitting with support", "No babbling", "Allergic reaction to new foods"],
    forCareTeam: ["6-month review and vaccinations.", "Weaning guidance.", "Dental care introduction."],
  },
  32: {
    title: "Week 32 — eight months",
    summary: "Crawling, pulling to stand, and first words may appear. Exploration accelerates.",
    tips: [
      "Create a safe floor play space.",
      "Respond to babbling to encourage language.",
      "Establish consistent sleep cues.",
      "Offer varied textures as chewing skills develop.",
    ],
    nutrition: ["Finger foods when ready", "Allergen introduction per guidance", "Family meals together"],
    warningSigns: ["No weight gain", "No response to name", "Regression in skills"],
    forCareTeam: ["8-month developmental review.", "Discuss sleep and feeding.", "Hearing check if concerned."],
  },
  40: {
    title: "Week 40 — ten months",
    summary: "Standing, cruising, and first words emerge. Curiosity drives constant movement.",
    tips: [
      "Childproof stairs and sharp corners.",
      "Read picture books with pointing and naming.",
      "Maintain routine amid increased activity.",
      "Offer water regularly as solids increase.",
    ],
    nutrition: ["Balanced family meals", "Limit added sugar", "Whole grains and proteins"],
    warningSigns: ["Not bearing weight on legs", "No gestures (wave, point)", "Persistent ear pulling with fever"],
    forCareTeam: ["10-month check.", "Immunisation catch-up if needed.", "Discuss daycare readiness."],
  },
  48: {
    title: "Week 48 — eleven months",
    summary: "First steps may appear. Language comprehension grows rapidly.",
    tips: [
      "Encourage walking with safe support — bare feet indoors helps balance.",
      "Name objects during daily routines.",
      "Limit screen time; prioritise interactive play.",
      "Practice cup drinking and self-feeding.",
    ],
    nutrition: ["Three meals plus snacks", "Full-fat dairy if tolerated", "Variety of colours on the plate"],
    warningSigns: ["No attempts to stand", "Loss of words", "Feeding regression"],
    forCareTeam: ["Pre-12-month review.", "Discuss transition to toddler milk if used.", "Safety counselling."],
  },
  52: {
    title: "Week 52 — first birthday & program completion",
    summary: "Congratulations — your baby turns one! The Meds-inn first-year care program is complete. Continue routine paediatric care.",
    tips: [
      "Celebrate milestones — every baby develops at their own pace.",
      "Transition to whole cow's milk after 12 months if advised.",
      "Maintain reading, play, and outdoor time daily.",
      "Schedule the 12-month health review and vaccinations.",
    ],
    nutrition: ["Family meals with variety", "Limit juice and sweets", "Regular meal times"],
    warningSigns: ["No walking by 18 months warrants review", "No words by 15 months", "Regression in any domain"],
    forCareTeam: [
      "12-month developmental and growth review.",
      "Complete first-year immunisation schedule.",
      "Celebrate care program completion and plan ongoing paediatric follow-up.",
    ],
  },
};

export function getBabyWeekAnchors(): number[] {
  return [...BABY_WEEK_ANCHORS];
}

export function getBabyEducation(babyWeeks: number): WeekEducation | null {
  if (babyWeeks > 52) return null;
  const week = Math.max(0, Math.min(52, babyWeeks));
  let anchor = BABY_WEEK_ANCHORS[0];
  for (const w of BABY_WEEK_ANCHORS) {
    if (w <= week) anchor = w;
    else break;
  }
  const content = BABY_CONTENT[anchor];
  if (!content) return null;
  return { week, trimester: "First", ...content };
}

export function isBabyCareProgramComplete(babyWeeks: number): boolean {
  return babyWeeks > 52;
}
