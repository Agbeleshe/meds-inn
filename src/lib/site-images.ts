/** Centralized image URLs for the marketing site (no third-party platform CDN). */

const unsplash = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const HEX_IMAGES = [
  { src: unsplash('photo-1584515935687-77582427935d'), alt: 'Pregnant mother hospital maternity portrait' },
  { src: unsplash('photo-1519689680058-324335c77eba'), alt: 'Pregnant Asian mother smiling natural light' },
  { src: unsplash('photo-1492724729914-74989c37b0d8'), alt: 'Pregnant Hispanic Latin mother portrait' },
  { src: unsplash('photo-1544717297-7782a793066a'), alt: 'Pregnant African mother warm studio portrait' },
  { src: unsplash('photo-1555252337-087f5dbe8e78'), alt: 'Pregnant European mother professional natural light' },
  { src: unsplash('photo-1559839734-2b71ea197ec2'), alt: 'Female doctor hospital white coat stethoscope' },
  { src: unsplash('photo-1576092764391-90c274a7d37b'), alt: 'Nurse midwife hospital scrubs portrait' },
  { src: unsplash('photo-1594824476967-48c8b964273f'), alt: 'Asian female doctor professional portrait' },
  { src: unsplash('photo-1631217865075-07467f73d763'), alt: 'African female nurse professional scrubs' },
  { src: unsplash('photo-1612349317150-e413f6a5b16d'), alt: 'Hispanic female doctor confident portrait' },
  { src: unsplash('photo-1515488042361-ee00e5ddd4e4'), alt: 'Mother with newborn baby hospital warm portrait' },
  { src: unsplash('photo-1502086223503-7ea5ec8d2110'), alt: 'Asian mother with toddler warm smiling portrait' },
  { src: unsplash('photo-1516627145497-ae393bffbf6e'), alt: 'African mother laughing with baby natural light' },
  { src: unsplash('photo-1488085068336-0b0b135e3597'), alt: 'European mother child warm portrait smile' },
  { src: unsplash('photo-1522675710814-c42534aa76aa'), alt: 'Latin mother with toddler warm smiling portrait' },
] as const;

export const LANDING_IMAGES = {
  workflow: {
    enrol: HEX_IMAGES[5].src,
    monitor: HEX_IMAGES[8].src,
    connect: HEX_IMAGES[7].src,
    continue: HEX_IMAGES[10].src,
  },
  testimonials: {
    doctor: HEX_IMAGES[9].src,
    midwife: HEX_IMAGES[6].src,
    motherPregnant: HEX_IMAGES[4].src,
    motherPostpartum: HEX_IMAGES[11].src,
  },
  antenatalClinic: unsplash('photo-1579684385110-59f295fb3876'),
  motherNewborn: unsplash('photo-1609220137047-40cc84116068'),
} as const;
