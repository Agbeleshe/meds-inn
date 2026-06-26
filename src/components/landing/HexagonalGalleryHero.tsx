/**
 * HexagonalGalleryHero — v5
 *
 * ── Infinite honeycomb scroll ────────────────────────────────────────────────
 * A flat stream of N=20 honeycomb rows (alternating 3-hex/4-hex, even/odd)
 * is rendered TWICE back-to-back in one flex-col track.
 * CSS keyframe: translateY(0 → -50%) over 55 s, then loops.
 *
 * Seamless seam guarantee:
 *   - N=20 (even) → copy1 ends on an odd row (4-hex full-width)
 *   - copy2 starts on row 0 (even = 3-hex indented)
 *   - That is exactly the natural continuation of the alternating pattern ✓
 *   - No paddingBottom on any cluster — row spacing is uniform throughout
 *
 * Height is capped at 100dvh on the section; the right panel fills it fully.
 * 4-sided gradient fades (top/bottom/left/right) blend hexes into the bg.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { HeartPulse, ArrowRight, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fadeUp, staggerSlow, scaleIn, viewport } from '@/lib/animations';

// ─── Images (exported so App.tsx can preload them on startup) ────────────────

export const HEX_IMAGES = [
  { src: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_716ebc85-9d2c-4458-acce-8148d2566a9f.jpg', alt: 'Pregnant mother hospital maternity portrait' },
  { src: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_0fb53c35-7712-425d-b9fc-a282562de598.jpg', alt: 'Pregnant Asian mother smiling natural light' },
  { src: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_daa2db90-7f7b-462d-ac2b-474c0b7f59e9.jpg', alt: 'Pregnant Hispanic Latin mother portrait' },
  { src: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_6e4783ac-db64-4628-8c44-687dd5d678a8.jpg', alt: 'Pregnant African mother warm studio portrait' },
  { src: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_d64109aa-a7b6-43e7-91f6-6d8e5fb95b3c.jpg', alt: 'Pregnant European mother professional natural light' },
  { src: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_fc0b4933-e01d-4fe5-bdc9-42c506fac535.jpg', alt: 'Female doctor hospital white coat stethoscope' },
  { src: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_1bd11433-b42e-43cd-95d2-fca294442593.jpg', alt: 'Nurse midwife hospital scrubs portrait' },
  { src: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_755f0197-4351-4ccb-8dc6-7479783cc846.jpg', alt: 'Asian female doctor professional portrait' },
  { src: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_3ddc9e2c-ec31-401f-915b-8905d5e90ae7.jpg', alt: 'African female nurse professional scrubs' },
  { src: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_d53eb03c-23ee-46af-b6a7-36be3a4964d5.jpg', alt: 'Hispanic female doctor confident portrait' },
  { src: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b96611b0-ecff-4ff4-8a44-d1e9ae553627.jpg', alt: 'Mother with newborn baby hospital warm portrait' },
  { src: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b1efac81-5850-4f26-a683-3be6c2809eae.jpg', alt: 'Asian mother with toddler warm smiling portrait' },
  { src: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_01272418-fcd7-4185-95de-1b6ba46f79e5.jpg', alt: 'African mother laughing with baby natural light' },
  { src: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_119bb20b-db9c-46e6-bd68-6fee817b2272.jpg', alt: 'European mother child warm portrait smile' },
  { src: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_0cf27186-c05e-4848-b37a-bd6ef28b3fa4.jpg', alt: 'Latin mother with toddler warm smiling portrait' },
];

// ─── Tile rows — flat stream of N=20 rows (MUST be even for seamless seam) ───
// Even rows: 3 hexes, indented by (W+gap)/2
// Odd rows:  4 hexes, no indent
// Images cycle continuously through HEX_IMAGES across all rows

const N_TILE_ROWS = 20; // even → copy1 ends odd, copy2 starts even → ✓ seamless

const TILE_ROWS: { indent: boolean; indices: number[] }[] = (() => {
  const rows: { indent: boolean; indices: number[] }[] = [];
  let cursor = 0;
  for (let r = 0; r < N_TILE_ROWS; r++) {
    const count = r % 2 === 0 ? 3 : 4;
    const indices: number[] = [];
    for (let c = 0; c < count; c++) {
      indices.push(cursor % HEX_IMAGES.length);
      cursor++;
    }
    rows.push({ indent: r % 2 === 0, indices });
  }
  return rows;
})();

// Pointy-top hexagon
const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

// Injected keyframe + track class
const SCROLL_STYLE = `
  @keyframes hex-scroll-up {
    0%   { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }
  .hex-scroll-track {
    will-change: transform;
    animation: hex-scroll-up 55s linear infinite;
  }
`;

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({ index, total, onClose, onPrev, onNext }: {
  index: number; total: number;
  onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  const img = HEX_IMAGES[index % HEX_IMAGES.length];
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose} role="dialog" aria-modal="true" aria-label={`Image viewer: ${img.alt}`}>
      <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium tabular-nums select-none">
        {(index % HEX_IMAGES.length) + 1} / {total}
      </span>
      <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" onClick={onClose} aria-label="Close lightbox">
        <X className="w-5 h-5" />
      </button>
      <button className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" onClick={e => { e.stopPropagation(); onPrev(); }} aria-label="Previous image">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <div className="relative max-w-[90vw] max-h-[85dvh] rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <img src={img.src} alt={img.alt} className="max-w-[90vw] max-h-[85dvh] object-contain" style={{ display: 'block' }} />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-6 py-4">
          <p className="text-white text-sm font-medium">{img.alt}</p>
        </div>
      </div>
      <button className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" onClick={e => { e.stopPropagation(); onNext(); }} aria-label="Next image">
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}

// ─── Single hex cell ─────────────────────────────────────────────────────────

function HexCell({ src, alt, onClick }: { src: string; alt: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={`View: ${alt}`}
      className="group relative shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-none"
      style={{ width: 'var(--hex-w)', height: 'var(--hex-h)', clipPath: HEX_CLIP }}>
      <img src={src} alt={alt} loading="eager" draggable={false}
        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        style={{ willChange: 'transform' }} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-25 transition-opacity duration-400 bg-primary" />
    </button>
  );
}

// ─── Flat tile strip — renders TILE_ROWS with uniform row spacing ─────────────
// No paddingBottom, no extra gaps — spacing is purely from marginTop overlap.

function TileStrip({ onOpen, keyPrefix }: { onOpen: (i: number) => void; keyPrefix: string }) {
  return (
    <div className="flex flex-col items-start" style={{ gap: 0 }}>
      {TILE_ROWS.map((row, ri) => (
        <div
          key={`${keyPrefix}-${ri}`}
          className="flex"
          style={{
            gap: 'var(--hex-gap)',
            marginLeft: row.indent ? 'calc((var(--hex-w) + var(--hex-gap)) / 2)' : '0',
            // All rows after the first pull up by 25% — exact same spacing at seam too
            marginTop: ri > 0 ? 'calc(var(--hex-h) * -0.25)' : '0',
          }}
        >
          {row.indices.map((imgIdx, ci) => (
            <HexCell
              key={`${keyPrefix}-${ri}-${ci}`}
              src={HEX_IMAGES[imgIdx].src}
              alt={HEX_IMAGES[imgIdx].alt}
              onClick={() => onOpen(imgIdx)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Scrolling panel — 2 × TileStrip stacked, drifting up infinitely ─────────

function ScrollingHoneycombPanel({ onOpen }: { onOpen: (i: number) => void }) {
  const BG = 'hsl(var(--background))';
  const fade = (dir: string) => `linear-gradient(${dir}, ${BG} 0%, transparent 100%)`;

  return (
    <>
      <style>{SCROLL_STYLE}</style>
      {/* overflow-hidden clips the scrolling content to the panel bounds */}
      <div className="relative w-full h-full overflow-hidden">
        {/* Track: copy1 + copy2 — identical, so the -50% jump is invisible */}
        <div className="hex-scroll-track flex flex-col items-center">
          <TileStrip onOpen={onOpen} keyPrefix="a" />
          {/*
            copy2 first row has ri=0 → marginTop=0 inside TileStrip.
            But it must continue from copy1's last row with the same -25% overlap.
            We add that overlap via a wrapper negative margin.
          */}
          <div style={{ marginTop: 'calc(var(--hex-h) * -0.25)' }}>
            <TileStrip onOpen={onOpen} keyPrefix="b" />
          </div>
        </div>

        {/* 4-sided fade overlays */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10" style={{ height: '28%', background: fade('to bottom') }} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10" style={{ height: '28%', background: fade('to top') }} />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10" style={{ width: '32%', background: fade('to right') }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10" style={{ width: '32%', background: fade('to left') }} />
      </div>
    </>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function HexagonalGalleryHero() {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const total = HEX_IMAGES.length;

  const openLightbox = useCallback((i: number) => setLightboxIdx(i), []);
  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const prevImage = useCallback(() => setLightboxIdx(i => i !== null ? (i - 1 + total) % total : null), [total]);
  const nextImage = useCallback(() => setLightboxIdx(i => i !== null ? (i + 1) % total : null), [total]);

  return (
    <>
      {lightboxIdx !== null && (
        <Lightbox index={lightboxIdx} total={total} onClose={closeLightbox} onPrev={prevImage} onNext={nextImage} />
      )}
      {/* Section is exactly one viewport tall — never overflows */}
      <section
        className="relative w-full bg-background overflow-hidden"
        style={{
          height: '100dvh',
          '--hex-w': 'clamp(150px, 16vw, 230px)',
          '--hex-h': 'calc(var(--hex-w) * 1.1547)',
          '--hex-gap': '8px',
        } as React.CSSProperties}
      >
        {/* ════════════ DESKTOP (lg+) ════════════ */}
        <div className="hidden lg:flex h-full">

          {/* Left — 50% column; inner content capped so text never exceeds 40% of viewport */}
          <div className="flex flex-col justify-center py-12 min-w-0" style={{ width: '50%' }}>
            <div className="px-10 xl:px-16" style={{ maxWidth: '47vw' }}>
            <motion.div
              variants={staggerSlow}
              initial="hidden"
              animate="visible"
              className="flex flex-col"
            >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-secondary text-primary text-xs font-medium mb-7 w-fit">
              <HeartPulse className="w-3.5 h-3.5" />
              Built for hospitals. Designed around mothers.
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl xl:text-5xl font-bold text-foreground leading-[1.1] text-balance mb-5">
              Maternal care should not end at the{' '}
              <span className="text-primary">hospital door.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-base text-muted-foreground leading-relaxed text-pretty mb-8">
              Meds-inn helps hospitals guide, monitor, and support mothers from
              conception through delivery and into the baby's first year.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col gap-3">
              <Link to="/login">
                <Button size="lg" className="w-full gap-2">
                  View hospital demo <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full">
                  Explore mother experience
                </Button>
              </Link>
            </motion.div>
            <motion.p variants={fadeUp} className="text-xs text-muted-foreground mt-3">No account required. All four demo roles.</motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mt-7">
              {[{ val: '8', label: 'care stages' }, { val: '+22%', label: 'adherence lift' }, { val: '< 4 hrs', label: 'nurse response' }].map(s => (
                <div key={s.label} className="flex items-baseline gap-1 px-3 py-2 rounded-lg border border-border bg-card">
                  <span className="text-base font-bold text-primary">{s.val}</span>
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </motion.div>
            </motion.div>
            </div>
          </div>

          {/* Right — scrolling honeycomb (50%) */}
          <div className="relative h-full min-w-0" style={{ width: '50%' }}>
            <ScrollingHoneycombPanel onOpen={openLightbox} />
          </div>
        </div>

        {/* ════════════ MOBILE (<lg) ════════════ */}
        {/* Honeycomb is absolute background; bleeds left+right for a wider, balanced shape */}
        <div className="lg:hidden relative h-full overflow-hidden">

          {/* Background: honeycomb stretched wider than the viewport (-25% each side) */}
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: '-25%',
              right: '-25%',
              width: '150%',
              '--hex-w': 'calc((150vw - 5 * var(--hex-gap)) / 4)',
            } as React.CSSProperties}
          >
            <ScrollingHoneycombPanel onOpen={openLightbox} />
          </div>

          {/* Scrim so text stays readable */}
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />

          {/* Content — centred vertically in the full viewport height */}
          <div className="relative z-10 flex flex-col justify-center h-full px-6 py-12">
            <h1 className="text-3xl font-bold text-foreground leading-[1.15] text-balance mb-3">
              Maternal care should not end at the{' '}
              <span className="text-primary">hospital door.</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed text-pretty mb-6">
              Meds-inn bridges the gap between clinic visits with nurse follow-ups, care plans, reminders, and AI-assisted briefs.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/login">
                <Button size="default" className="w-full gap-2">
                  View hospital demo <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="default" variant="outline" className="w-full">
                  Explore mother experience
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}


