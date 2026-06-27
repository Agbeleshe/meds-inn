/**
 * TourPromptModal
 *
 * Shown once per session when a user first lands on the dashboard.
 * Offers a clear Yes / No choice before starting the guided tour.
 * Dismissed state is stored in sessionStorage so it re-appears on every
 * new login session (matching the tour's own sessionStorage key).
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { LogoMark } from '@/components/common/Logo';

const PROMPT_KEY = 'medinn_tour_prompt_seen';

interface TourPromptModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function TourPromptModal({ onAccept, onDecline }: TourPromptModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem(PROMPT_KEY);
    if (!seen) {
      // Small delay so the dashboard layout finishes mounting first
      const t = setTimeout(() => setVisible(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = (accepted: boolean) => {
    sessionStorage.setItem(PROMPT_KEY, 'true');
    setVisible(false);
    // Wait for exit animation then call parent callback
    setTimeout(() => {
      if (accepted) onAccept();
      else onDecline();
    }, 300);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="tour-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            key="tour-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-prompt-title"
            aria-describedby="tour-prompt-desc"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-[calc(100%-2rem)] md:max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">

              {/* Top accent bar */}
              <div className="h-1.5 bg-primary w-full" />

              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-5 pb-1">
                <div className="flex items-center gap-3">
                  <LogoMark size="lg" />
                  <div>
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-0.5">
                      Welcome to Meds-inn
                    </p>
                    <h2
                      id="tour-prompt-title"
                      className="text-base font-bold text-foreground leading-tight text-balance"
                    >
                      Would you like a guided tour?
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(false)}
                  aria-label="Dismiss"
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mt-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-4">
                <p
                  id="tour-prompt-desc"
                  className="text-sm text-muted-foreground leading-relaxed text-pretty"
                >
                  We'll walk you through the top bar and every navigation section
                  — so you know exactly where everything lives from day one.
                  The whole tour takes under two minutes and you can skip it at
                  any point.
                </p>

                {/* Feature highlights */}
                <ul className="mt-4 space-y-2">
                  {[
                    'Top-bar tools — search, notifications & profile',
                    'Every navigation section explained individually',
                    'Tap any ⓘ icon later to re-read a section\'s purpose',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="text-pretty">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 px-6 pb-6 pt-2">
                <button
                  type="button"
                  onClick={() => dismiss(true)}
                  className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Yes, show me around
                </button>
                <button
                  type="button"
                  onClick={() => dismiss(false)}
                  className="flex-1 h-10 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-muted active:scale-[0.98] transition-all duration-150"
                >
                  No thanks
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
