/** Standard ABO/Rh blood groups used in clinical forms. */
export const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const BABY_GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'unknown', label: 'Unknown / not specified' },
] as const;

export type BabyGender = (typeof BABY_GENDERS)[number]['value'];
