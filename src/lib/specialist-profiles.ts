import { LANDING_IMAGES } from '@/lib/site-images.js';
import { resolveDoctorUserId, resolveNurseUserId } from '@/lib/assignments.js';
import type { Mother } from '@/types/clinical.js';

export interface SpecialistProfile {
  userId: string;
  name: string;
  role: 'nurse' | 'doctor';
  specialty: string;
  age: number;
  yearsExperience: number;
  bio: string;
  photoUrl: string;
  languages: string[];
  credentials: string;
}

/** Patient-facing profiles for assigned care team members */
export const SPECIALIST_PROFILES: Record<string, SpecialistProfile> = {
  'user-nurse': {
    userId: 'user-nurse',
    name: 'Elena Costa',
    role: 'nurse',
    specialty: 'Senior Midwife',
    age: 34,
    yearsExperience: 11,
    bio: 'Elena supports mothers through every stage of pregnancy and early postpartum. She focuses on warm, practical guidance and quick follow-up when you have questions between visits.',
    photoUrl: LANDING_IMAGES.testimonials.midwife,
    languages: ['English', 'Italian', 'Spanish'],
    credentials: 'RN, Certified Midwife (CM)',
  },
  'user-doctor': {
    userId: 'user-doctor',
    name: 'Dr. Priya Sharma',
    role: 'doctor',
    specialty: 'Obstetrics & Gynaecology',
    age: 41,
    yearsExperience: 16,
    bio: 'Dr. Sharma leads antenatal and high-risk pregnancy care at Elara. She explains clinical decisions clearly so you always know what to expect at your next appointment.',
    photoUrl: LANDING_IMAGES.testimonials.doctor,
    languages: ['English', 'Hindi', 'Gujarati'],
    credentials: 'MD, FRCOG',
  },
};

export function getSpecialistProfile(userId: string | null | undefined): SpecialistProfile | null {
  if (!userId) return null;
  return SPECIALIST_PROFILES[userId] ?? null;
}

export function getSpecialistProfileByName(
  displayName: string,
  role: 'nurse' | 'doctor',
): SpecialistProfile | null {
  if (!displayName || displayName === 'To be assigned') return null;

  const userId =
    role === 'nurse' ? resolveNurseUserId(displayName) : resolveDoctorUserId(displayName);
  if (userId) return getSpecialistProfile(userId);

  const normalized = displayName.replace(/^Nurse\s+|^Dr\.\s+/i, '').trim().toLowerCase();
  return (
    Object.values(SPECIALIST_PROFILES).find(
      (p) =>
        p.role === role &&
        p.name.replace(/^Dr\.\s+/i, '').trim().toLowerCase().includes(normalized),
    ) ?? null
  );
}

export function getMotherSpecialists(mother: Pick<
  Mother,
  'assignedNurseUserId' | 'assignedDoctorUserId'
>) {
  return {
    nurse: getSpecialistProfile(mother.assignedNurseUserId),
    doctor: getSpecialistProfile(mother.assignedDoctorUserId),
  };
}
