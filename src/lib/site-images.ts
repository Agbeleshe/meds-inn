/** Meds-inn marketing & app imagery — local assets from meds-inn-photos */

const photo = (n: number) => `/images/photos/photo-${String(n).padStart(2, '0')}.png`;

export const HEX_IMAGES = [
  { src: photo(1), alt: 'Maternal care — pregnant mother portrait' },
  { src: photo(2), alt: 'Maternal care — expecting mother smiling' },
  { src: photo(3), alt: 'Maternal care — mother wellness portrait' },
  { src: photo(4), alt: 'Maternal care — warm pregnancy portrait' },
  { src: photo(5), alt: 'Maternal care — professional mother portrait' },
  { src: photo(6), alt: 'Clinical team — doctor hospital portrait' },
  { src: photo(7), alt: 'Clinical team — nurse midwife portrait' },
  { src: photo(8), alt: 'Clinical team — specialist portrait' },
  { src: photo(9), alt: 'Clinical team — care professional portrait' },
  { src: photo(10), alt: 'Clinical team — obstetric specialist portrait' },
  { src: photo(11), alt: 'Family care — mother with newborn' },
  { src: photo(12), alt: 'Family care — mother and child' },
  { src: photo(13), alt: 'Family care — joyful mother and baby' },
  { src: photo(14), alt: 'Family care — warm family portrait' },
  { src: photo(15), alt: 'Family care — tender newborn moment' },
  { src: photo(16), alt: 'Clinical care — compassionate specialist' },
  { src: photo(17), alt: 'Maternal wellness — peaceful pregnancy' },
  { src: photo(18), alt: 'Family care — mother bonding with baby' },
  { src: photo(19), alt: 'Clinical team — dedicated nurse' },
  { src: photo(20), alt: 'Maternal care — joyful expecting mother' },
  { src: photo(21), alt: 'Family care — newborn first days' },
] as const;

export const LANDING_IMAGES = {
  workflow: {
    enrol: photo(16),
    monitor: photo(19),
    connect: photo(6),
    continue: photo(18),
  },
  testimonials: {
    doctor: photo(8),
    midwife: photo(7),
    motherPregnant: photo(17),
    motherPostpartum: photo(21),
  },
  antenatalClinic: photo(6),
  motherNewborn: photo(11),
  signupDoctor: photo(8),
  signupMother: photo(21),
  heroBg: photo(20),
  featuresBg: photo(16),
  journeyBg: photo(18),
} as const;

/** All image URLs to preload on splash (deduped). */
export function getAllPreloadImageUrls(): string[] {
  const urls = new Set<string>();
  for (const img of HEX_IMAGES) urls.add(img.src);
  urls.add(LANDING_IMAGES.antenatalClinic);
  urls.add(LANDING_IMAGES.motherNewborn);
  urls.add(LANDING_IMAGES.signupDoctor);
  urls.add(LANDING_IMAGES.signupMother);
  return [...urls];
}
