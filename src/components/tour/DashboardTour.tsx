/**
 * DashboardTour — powered by Driver.js
 *
 * Flow on first session:
 *   1. TourPromptModal appears → user chooses Yes / No
 *   2. On Yes: Driver.js tour starts; TopBar steps play first
 *   3. On mobile: Sheet auto-opens before first nav step (no user action)
 *   4. Nav steps walk through every sidebar/sheet item with rich copy
 *
 * Info-icon mini-tours use the same Driver instance with a fresh step list.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { driver } from 'driver.js';
import type { DriveStep, Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTour } from '@/contexts/TourContext';
import { TourPromptModal } from './TourPromptModal';
import { useApp } from '@/contexts/AppContext';
import { NAV_ITEMS, MOTHER_NAV_ITEMS } from '@/lib/nav-items';
import { NAV_DESCRIPTIONS } from '@/lib/nav-descriptions';
import type { TourStep } from '@/contexts/TourContext';

/** True when viewport < lg (1024 px) */
function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 1024;
}

/** Number of TopBar steps before the first nav step */
const TOPBAR_STEP_COUNT = 6;

/** Convert our TourStep shape → Driver.js DriveStep */
function toDriveStep(s: TourStep): DriveStep {
  return {
    element: s.element,
    popover: {
      title: s.popover.title,
      description: s.popover.description,
      side: s.popover.side,
      align: s.popover.align ?? 'start',
    },
  };
}

/** Build the full nav tour: TopBar steps → sidebar / mobile-sheet nav steps */
function buildDriveSteps(role: string): DriveStep[] {
  const mobile = isMobile();
  const prefix = mobile ? 'mob-nav' : 'desk-nav';

  const navItems = role === 'mother'
    ? MOTHER_NAV_ITEMS
    : NAV_ITEMS.filter(item => !item.roles || item.roles.includes(role));

  const topBarSteps: DriveStep[] = [
    {
      element: '[data-tour="topbar"]',
      popover: {
        title: 'Your Command Bar',
        description: 'The top bar is always visible across every page. It gives you quick access to search, notifications, your profile, and the theme toggle — wherever you are in the platform.',
        side: 'bottom', align: 'start',
      },
    },
    {
      element: '[data-tour="topbar-search"]',
      popover: {
        title: 'Global Search',
        description: 'Search across all patients, appointments, documents, and care briefs in real time. Start typing a mother\'s name, ID, or appointment date to find it instantly.',
        side: 'bottom', align: 'start',
      },
    },
    {
      element: '[data-tour="topbar-notifications"]',
      popover: {
        title: 'Notifications',
        description: 'Clinical alerts, appointment reminders, and team messages surface here as they happen. The red dot indicates unread notifications requiring your attention.',
        side: 'bottom', align: 'end',
      },
    },
    {
      element: '[data-tour="topbar-theme"]',
      popover: {
        title: 'Light & Dark Mode',
        description: 'Switch between light and dark themes to suit your environment — whether you\'re in a bright clinic or reviewing records in a low-light setting.',
        side: 'bottom', align: 'end',
      },
    },
    {
      element: '[data-tour="topbar-profile"]',
      popover: {
        title: 'Your Profile',
        description: 'Access your account settings, switch between demo roles (Admin, Nurse, Doctor, Mother), or sign out. Your initials and name are shown here for quick reference.',
        side: 'bottom', align: 'end',
      },
    },
    {
      element: '[data-tour="topbar-tour"]',
      popover: {
        title: 'Replay This Tour',
        description: 'You can restart this guided walkthrough at any time by clicking the Tour button here. It\'s always available when you need a refresher.',
        side: 'bottom', align: 'end',
      },
    },
  ];

  const navSteps: DriveStep[] = navItems.map(item => ({
    element: `[data-tour="${prefix}-${item.key}"]`,
    popover: {
      title: item.label,
      description: NAV_DESCRIPTIONS[item.key] ?? `Navigate to ${item.label}.`,
      side: 'right', align: 'start',
    },
  }));

  return [...topBarSteps, ...navSteps];
}

export function DashboardTour() {
  const {
    tourActive, pendingSteps, stopTour,
    isFirstVisit, startTour, setMobileMenuOpen,
  } = useTour();
  const { role } = useApp();

  // Stable Driver instance across renders
  const driverRef = useRef<Driver | null>(null);
  // Prevent double-opening the mobile sheet
  const sheetOpenedRef = useRef(false);

  /** Destroy any running Driver instance cleanly */
  const destroyDriver = useCallback(() => {
    try { driverRef.current?.destroy(); } catch { /* ignore */ }
    driverRef.current = null;
  }, []);

  /** Create and start a Driver tour with the given steps */
  const launchDriver = useCallback((steps: DriveStep[]) => {
    destroyDriver();

    const d = driver({
      animate: true,
      smoothScroll: true,
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 8,
      allowClose: true,
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: '✓ Done',
      showProgress: true,
      progressText: '{{current}} of {{total}}',
      popoverClass: 'medinn-driver-popover',
      steps,
      onDestroyStarted: () => {
        stopTour();
        setMobileMenuOpen(false);
        sheetOpenedRef.current = false;
      },
      onHighlightStarted: (_el, step, opts) => {
        const idx = opts.state.activeIndex ?? 0;
        // Auto-open mobile sheet before the first nav step
        if (isMobile() && idx === TOPBAR_STEP_COUNT && !sheetOpenedRef.current) {
          sheetOpenedRef.current = true;
          d.drive(idx);            // re-drive same step after sheet opens
          setMobileMenuOpen(true);
          // Give Sheet animation time to complete, then advance
          setTimeout(() => d.drive(idx), 400);
          return false;            // cancel this highlight; we'll re-trigger
        }
        // Close sheet when going back to TopBar steps
        if (isMobile() && idx < TOPBAR_STEP_COUNT) {
          setMobileMenuOpen(false);
          sheetOpenedRef.current = false;
        }
      },
    });

    driverRef.current = d;
    d.drive();
  }, [destroyDriver, stopTour, setMobileMenuOpen]);

  // React to tourActive changes
  useEffect(() => {
    if (!tourActive) {
      destroyDriver();
      sheetOpenedRef.current = false;
      return;
    }

    const steps = pendingSteps.length > 0
      ? pendingSteps.map(toDriveStep)
      : buildDriveSteps(role);

    // Small delay so DOM/layout is fully settled before Driver scans elements
    const t = setTimeout(() => launchDriver(steps), 120);
    return () => clearTimeout(t);
  }, [tourActive, pendingSteps, role, launchDriver, destroyDriver]);

  // Cleanup on unmount
  useEffect(() => () => destroyDriver(), [destroyDriver]);

  /** Prompt accepted → start tour */
  const handlePromptAccept = useCallback(() => startTour(), [startTour]);
  /** Prompt declined → no-op (modal already marked session seen) */
  const handlePromptDecline = useCallback(() => {}, []);

  return (
    <>
      {isFirstVisit && !tourActive && (
        <TourPromptModal
          onAccept={handlePromptAccept}
          onDecline={handlePromptDecline}
        />
      )}
    </>
  );
}
