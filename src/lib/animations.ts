/**
 * Shared Framer Motion variants used consistently across the entire app.
 *
 * Design principles:
 *  - All animations use ease-out or spring — never linear (feels mechanical)
 *  - Duration: 0.4–0.6 s for reveals, 0.2–0.3 s for micro-interactions
 *  - Stagger parent uses 0.08–0.12 s child delay
 *  - viewport: { once: true } keeps performance cost to a minimum
 */

import type { Variants } from 'framer-motion';

// ─── Core reveal variants ────────────────────────────────────────────────────

/** Fade up — most common section/card entrance */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Fade in — for overlays, modals, full-page transitions */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

/** Slide in from left — sidebar, nav items */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Slide in from right */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Slide down — top bars, headers */
export const slideDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Scale in — cards, modal content, badges */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── Stagger containers ───────────────────────────────────────────────────────

/** Parent that staggers children with 0.08 s delay */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

/** Tighter stagger for dense lists (nav items, table rows) */
export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

/** Slower stagger for large hero sections */
export const staggerSlow: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

// ─── Viewport shorthand ───────────────────────────────────────────────────────

/** Standard viewport config: trigger once, 10 % margin */
export const viewport = { once: true, margin: '-10% 0px' } as const;
