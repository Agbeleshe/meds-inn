import type { Hospital } from "@/types/clinical.js";

/** Partner hospitals — only the first is active in auth UI for now */
export const HOSPITALS: Hospital[] = [
  {
    id: "ELR",
    name: "Elara Women's Specialist Clinic",
    shortName: "Elara WSC",
    location: "London, UK",
  },
  {
    id: "SUN",
    name: "Sunrise Maternity Centre",
    shortName: "Sunrise MC",
    location: "Toronto, Canada",
  },
];

/** The one institution users can enrol with today */
export const ACTIVE_HOSPITAL = HOSPITALS[0];
export const ACTIVE_HOSPITAL_ID = ACTIVE_HOSPITAL.id;

export function getHospitalById(id: string): Hospital | undefined {
  return HOSPITALS.find((h) => h.id === id);
}
