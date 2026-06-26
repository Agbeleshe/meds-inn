import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const TOUR_KEY = 'medinn_tour_seen';

/** A single Driver.js-compatible tour step */
export interface TourStep {
  /** CSS selector or DOM element to highlight */
  element?: string;
  popover: {
    title: string;
    description: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
  };
}

interface TourContextValue {
  tourActive: boolean;
  /** Steps queued for the element mini-tour (info icon) */
  pendingSteps: TourStep[];
  startTour: () => void;
  stopTour: () => void;
  /** Fire a focused single/multi-step tour for one element (ⓘ icon) */
  startElementTour: (steps: TourStep[]) => void;
  isFirstVisit: boolean;
  /** Controlled by DashboardTour to open the mobile sheet mid-tour */
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [tourActive, setTourActive]         = useState(false);
  const [isFirstVisit, setIsFirstVisit]     = useState(false);
  const [pendingSteps, setPendingSteps]     = useState<TourStep[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // sessionStorage → auto-prompt on every new login session
    if (!sessionStorage.getItem(TOUR_KEY)) setIsFirstVisit(true);
  }, []);

  const startTour = useCallback(() => {
    setPendingSteps([]);
    setTourActive(true);
  }, []);

  const stopTour = useCallback(() => {
    setTourActive(false);
    setPendingSteps([]);
    setMobileMenuOpen(false);
    sessionStorage.setItem(TOUR_KEY, 'true');
    setIsFirstVisit(false);
  }, []);

  const startElementTour = useCallback((steps: TourStep[]) => {
    setTourActive(false);
    setTimeout(() => {
      setPendingSteps(steps);
      setTourActive(true);
    }, 80);
  }, []);

  return (
    <TourContext.Provider value={{
      tourActive, pendingSteps, startTour, stopTour,
      startElementTour, isFirstVisit,
      mobileMenuOpen, setMobileMenuOpen,
    }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}
