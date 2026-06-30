import type { TimelineEvent } from "../types/clinical.js";

export const DEFAULT_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: "tl1",
    date: "2026-06-20",
    type: "appointment",
    title: "22-Week Antenatal Visit",
    note: "Routine check. Fundal height 22cm. FHR 148bpm. Blood pressure 118/76.",
    by: "Dr. Tolu Adebayo",
  },
  {
    id: "tl2",
    date: "2026-06-18",
    type: "nurse-note",
    title: "Nurse Follow-up Call",
    note: "Patient reported mild fatigue and occasional dizziness. Advised to increase fluid intake and rest between tasks. Scheduled monitoring check.",
    by: "Nurse Esther Okonkwo",
  },
  {
    id: "tl3",
    date: "2026-06-14",
    type: "lab",
    title: "Lab Results Received",
    note: "FBC: Hb 10.8 g/dL (slightly below range). Iron supplementation continued.",
    by: "Lab Services",
  },
  {
    id: "tl4",
    date: "2026-06-01",
    type: "scan",
    title: "20-Week Anomaly Scan",
    note: "Anatomy scan complete. No anomalies detected. Baby in cephalic position. Estimated weight 523g.",
    by: "Imaging Suite, Elara WSC",
  },
  {
    id: "tl5",
    date: "2026-04-10",
    type: "appointment",
    title: "12-Week Dating Scan & Bloods",
    note: "NT measurement 1.2mm. Booking bloods all within normal range. Hepatitis B negative.",
    by: "Dr. Tolu Adebayo",
  },
];
