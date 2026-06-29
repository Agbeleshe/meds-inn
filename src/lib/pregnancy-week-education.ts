export interface WeekEducation {
  week: number;
  trimester: "First" | "Second" | "Third";
  title: string;
  summary: string;
  tips: string[];
  nutrition: string[];
  warningSigns: string[];
  forCareTeam: string[];
}

function trimesterForWeek(week: number): WeekEducation["trimester"] {
  if (week <= 13) return "First";
  if (week <= 27) return "Second";
  return "Third";
}

const WEEK_CONTENT: Record<number, Omit<WeekEducation, "week" | "trimester">> = {
  4: {
    title: "Early confirmation & foundation",
    summary: "The embryonic period begins. Focus on folate, rest, and confirming care with your team.",
    tips: [
      "Take a prenatal vitamin with 400–800 mcg folic acid daily unless your clinician advises otherwise.",
      "Avoid alcohol, smoking, and unpasteurised foods.",
      "Schedule your first booking visit if you have not already.",
      "Track any bleeding or severe pain — contact your care team immediately.",
    ],
    nutrition: ["Leafy greens", "Fortified cereals", "Citrus fruits", "Plenty of water"],
    warningSigns: ["Heavy bleeding", "Severe one-sided abdominal pain", "Dizziness with fainting"],
    forCareTeam: [
      "Confirm LMP/EDD and risk stratification at booking.",
      "Review medications for teratogenic risk.",
      "Provide early pregnancy education on warning signs.",
    ],
  },
  8: {
    title: "First trimester wellness",
    summary: "Major organs are forming. Nausea is common — small, frequent meals often help.",
    tips: [
      "Eat small meals every 2–3 hours to manage nausea.",
      "Ginger tea or crackers before getting out of bed may ease morning sickness.",
      "Continue prenatal vitamins even if appetite is low.",
      "Rest when tired — fatigue is normal as your body adapts.",
    ],
    nutrition: ["Plain crackers", "Bananas", "Boiled eggs", "Broth-based soups"],
    warningSigns: ["Unable to keep fluids down for 24 hours", "Significant weight loss", "Severe abdominal cramping"],
    forCareTeam: [
      "Assess hyperemesis symptoms and hydration status.",
      "Offer anti-emetic guidance per local protocol if needed.",
      "Reinforce folate and iron screening timeline.",
    ],
  },
  12: {
    title: "End of first trimester",
    summary: "Miscarriage risk drops significantly. Many parents share news with family around now.",
    tips: [
      "First-trimester screening or NIPT may be discussed at your next visit.",
      "Continue gentle activity — walking and prenatal yoga are usually safe.",
      "Dental check-ups are safe and recommended — gum health affects pregnancy.",
      "Start thinking about birth preferences — no need to finalise yet.",
    ],
    nutrition: ["Lean protein at each meal", "Whole grains", "Calcium-rich foods"],
    warningSigns: ["Fresh bleeding", "Fever", "Burning urination"],
    forCareTeam: [
      "Review dating scan results and adjust EDD if indicated.",
      "Discuss screening options (combined test, NIPT, anomaly scan timing).",
      "Document mental health baseline and support network.",
    ],
  },
  16: {
    title: "Second trimester begins",
    summary: "Energy often returns. You may start feeling fluttering movements soon.",
    tips: [
      "Many people feel first movements between 16–22 weeks — both are normal.",
      "Sleep on your side when comfortable; a pillow between knees helps.",
      "Stay hydrated — aim for regular sips throughout the day.",
      "Wear supportive footwear as your centre of gravity shifts.",
    ],
    nutrition: ["Salmon (well cooked)", "Lentils", "Greek yogurt", "Colourful vegetables"],
    warningSigns: ["Regular tightening before 37 weeks", "Painful urination", "Sudden swelling of face/hands"],
    forCareTeam: [
      "Plan anomaly scan (typically 18–22 weeks).",
      "Review iron studies if fatigue persists.",
      "Discuss exercise and work accommodations.",
    ],
  },
  20: {
    title: "Halfway milestone",
    summary: "Anomaly scan territory. Baby movements become more noticeable for many mothers.",
    tips: [
      "Attend your anatomy scan — bring questions about findings.",
      "Pelvic floor exercises (Kegels) support recovery after birth.",
      "Moisturise growing belly skin to ease itching.",
      "Begin noting kick patterns once movements are consistent.",
    ],
    nutrition: ["Iron-rich foods with vitamin C", "Avocado", "Sweet potato", "Nuts and seeds"],
    warningSigns: ["Reduced movements once pattern established", "Vision changes", "Persistent headache"],
    forCareTeam: [
      "Review anomaly scan report and referral pathways.",
      "Discuss gestational diabetes screening timing (24–28 weeks).",
      "Update birth plan discussion points.",
    ],
  },
  24: {
    title: "Viability & glucose screening",
    summary: "Glucose tolerance test is usually offered. Premature labour awareness increases.",
    tips: [
      "Complete OGTT as scheduled — fasting may be required.",
      "Learn preterm labour signs: regular contractions, pelvic pressure, backache.",
      "Consider antenatal classes — many hospitals offer them from 24–28 weeks.",
      "Pack a small hospital bag checklist to discuss with your nurse.",
    ],
    nutrition: ["Complex carbs in moderation for GTT prep", "High-fibre foods", "Plenty of water"],
    warningSigns: ["Regular contractions every 10 minutes", "Fluid gush", "Decreased fetal movement"],
    forCareTeam: [
      "Schedule and follow up OGTT results.",
      "Reinforce kick-count education after movements are regular.",
      "Assess need for additional growth scans in high-risk cases.",
    ],
  },
  28: {
    title: "Third trimester approaches",
    summary: "Third trimester begins. More frequent visits may be scheduled.",
    tips: [
      "Start sleeping predominantly on your left side for optimal circulation.",
      "Elevate feet when resting to reduce ankle swelling.",
      "Practise slow breathing for labour preparation.",
      "Discuss who will support you during labour and postpartum.",
    ],
    nutrition: ["Continue iron if prescribed", "Small frequent meals", "Limit excessive caffeine"],
    warningSigns: ["Severe headache with swelling", "Visual disturbances", "Upper abdominal pain"],
    forCareTeam: [
      "Increase visit frequency per protocol (often every 2 weeks from 28 weeks).",
      "Screen for pre-eclampsia symptoms at each contact.",
      "Review Tdap vaccination if not yet given.",
    ],
  },
  32: {
    title: "Growth & positioning",
    summary: "Baby gains weight rapidly. Braxton Hicks contractions are common and usually harmless.",
    tips: [
      "Braxton Hicks: irregular, often ease with movement or hydration.",
      "Finalise paediatric provider or hospital newborn team if applicable.",
      "Prepare freezer meals and postpartum support plan.",
      "Install car seat and have it checked if possible.",
    ],
    nutrition: ["Protein-rich snacks", "Calcium sources", "Hydrating fruits"],
    warningSigns: ["Painful regular contractions", "Reduced movements", "Leaking green/brown fluid"],
    forCareTeam: [
      "Assess fetal growth and presentation.",
      "Discuss birth plan, pain relief options, and hospital admission process.",
      "Screen for anaemia and Group B Strep timing (35–37 weeks).",
    ],
  },
  36: {
    title: "Full term approaching",
    summary: "Weekly visits often begin. Baby should be head-down — your team will confirm.",
    tips: [
      "Pack hospital bag with documents, charger, comfortable clothes, and baby outfit.",
      "Know when to call: waters breaking, regular contractions, reduced movements.",
      "Rest frequently — insomnia is common; naps help.",
      "Review breastfeeding basics with your nurse or lactation contact.",
    ],
    nutrition: ["Light meals as due date nears", "Electrolyte drinks if vomiting in labour prep"],
    warningSigns: ["No fetal movement for 2 hours after 28 weeks", "Bright red bleeding", "Severe constant pain"],
    forCareTeam: [
      "Weekly antenatal checks including BP, urine, and fundal height.",
      "Confirm GBS swab and results.",
      "Review induction plan if post-dates risk factors present.",
    ],
  },
  38: {
    title: "Early term",
    summary: "Baby is considered early term. Labour could start any time — stay in close contact with your team.",
    tips: [
      "Keep phone charged and hospital route planned.",
      "Practise timing contractions — 5-1-1 rule: every 5 min, 1 min long, for 1 hour.",
      "Stay calm — most labours progress gradually.",
      "Continue daily kick awareness until labour begins.",
    ],
    nutrition: ["Easy-to-digest foods", "Avoid heavy meals if contractions start"],
    warningSigns: ["Decreased movements", "Heavy bleeding", "High fever"],
    forCareTeam: [
      "Confirm on-call arrangements and triage pathway.",
      "Review signs of labour and when to attend hospital.",
      "Ensure postpartum and baby profile workflows are ready.",
    ],
  },
  40: {
    title: "Due date week",
    summary: "Congratulations on reaching your due date. Only about 5% of babies arrive exactly on this day.",
    tips: [
      "Post-dates monitoring may include NST or ultrasound — attend all scheduled checks.",
      "Walking and gentle movement may help comfort but won't force labour.",
      "Discuss induction timeline if pregnancy continues beyond 41 weeks.",
      "Rest and lean on your support network.",
    ],
    nutrition: ["Balanced meals", "Stay hydrated", "Avoid herbal labour inducers unless clinician-approved"],
    warningSigns: ["No movements", "Waters break without contractions after 24h — follow local advice", "Heavy bleeding"],
    forCareTeam: [
      "Post-dates surveillance per hospital protocol.",
      "Discuss induction of labour if ≥41 weeks or earlier if indicated.",
      "Prepare delivery documentation and baby care handover.",
    ],
  },
};

function interpolateWeek(week: number): Omit<WeekEducation, "week" | "trimester"> {
  const anchors = [4, 8, 12, 16, 20, 24, 28, 32, 36, 38, 40];
  let anchor = anchors[0];
  for (const a of anchors) {
    if (week >= a) anchor = a;
  }
  const base = WEEK_CONTENT[anchor] ?? WEEK_CONTENT[20];
  const trimester = trimesterForWeek(week);
  return {
    title: `Week ${week}: ${base.title}`,
    summary: base.summary,
    tips: [
      ...base.tips,
      `You are in the ${trimester.toLowerCase()} trimester — your care team tailors visits to this stage.`,
    ],
    nutrition: base.nutrition,
    warningSigns: base.warningSigns,
    forCareTeam: base.forCareTeam,
  };
}

export function getWeekEducation(week: number): WeekEducation | null {
  if (week < 1 || week > 42) return null;
  const content = WEEK_CONTENT[week] ?? interpolateWeek(week);
  return {
    week,
    trimester: trimesterForWeek(week),
    ...content,
    title: WEEK_CONTENT[week]?.title ? `Week ${week}: ${WEEK_CONTENT[week].title}` : content.title,
  };
}

export function getTrimesterWeeks(trimester: WeekEducation["trimester"]): number[] {
  const ranges: Record<WeekEducation["trimester"], [number, number]> = {
    First: [1, 13],
    Second: [14, 27],
    Third: [28, 42],
  };
  const [start, end] = ranges[trimester];
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export const POSTPARTUM_EDUCATION: WeekEducation = {
  week: 0,
  trimester: "First",
  title: "Postpartum recovery & newborn care",
  summary: "Your body is healing and your baby is adapting to life outside the womb. Gentle recovery and feeding support are priorities.",
  tips: [
    "Rest when baby sleeps — recovery is physical and emotional work.",
    "Watch for heavy bleeding (soaking a pad in an hour) and report to your team.",
    "Skin-to-skin contact supports bonding and breastfeeding.",
    "Accept help with meals, laundry, and errands.",
    "Baby blues are common; seek support if low mood persists beyond two weeks.",
  ],
  nutrition: [
    "Warm nourishing meals",
    "Plenty of fluids especially if breastfeeding",
    "Iron-rich foods if anaemic post-delivery",
    "One-handed snacks for feeding sessions",
  ],
  warningSigns: [
    "Heavy or foul-smelling bleeding",
    "Fever or wound redness",
    "Thoughts of harming yourself or baby",
    "Breast redness with fever (mastitis)",
  ],
  forCareTeam: [
    "Schedule 6-week maternal review and newborn checks.",
    "Screen for postnatal depression using validated tools.",
    "Support breastfeeding or formula feeding choice without judgment.",
    "Ensure baby profile is complete for paediatric continuity.",
  ],
};
