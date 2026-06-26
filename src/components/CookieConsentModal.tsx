/**
 * CookieConsentModal
 *
 * Shown once on first visit (any page). Persists choice to localStorage.
 * Three actions: Accept All | Reject Non-Essential | Manage Preferences
 * Manage Preferences expands inline toggles per category.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ChevronDown, ChevronUp, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

const STORAGE_KEY = 'medinn_cookie_consent';

export interface CookiePreferences {
  essential: true;
  analytics: boolean;
  marketing: boolean;
}

function loadPrefs(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePrefs(prefs: CookiePreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export function CookieConsentModal() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);
  // Animate in/out
  const [animOut, setAnimOut] = useState(false);

  useEffect(() => {
    const prefs = loadPrefs();
    if (!prefs) {
      // Small delay so splash screen fully clears first
      const t = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss(prefs: CookiePreferences) {
    savePrefs(prefs);
    setAnimOut(true);
    setTimeout(() => setVisible(false), 400);
  }

  function acceptAll() {
    dismiss({ essential: true, analytics: true, marketing: true });
  }

  function rejectNonEssential() {
    dismiss({ essential: true, analytics: false, marketing: false });
  }

  function saveCustom() {
    dismiss({ essential: true, analytics, marketing });
  }

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[900] bg-black/40 backdrop-blur-[2px]"
        style={{
          animation: animOut ? 'cookie-fade-out 400ms ease-in-out forwards' : 'cookie-fade-in 350ms ease-out forwards',
        }}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cookie consent"
        className="fixed bottom-0 left-0 right-0 z-[901] flex justify-center px-4 pb-6 md:pb-8"
        style={{
          animation: animOut
            ? 'cookie-slide-out 400ms ease-in-out forwards'
            : 'cookie-slide-in 400ms cubic-bezier(0.22,1,0.36,1) forwards',
        }}
      >
        <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header strip */}
          <div className="flex items-start gap-3 px-6 pt-6 pb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-foreground leading-snug mb-1">
                We Value Your Privacy
              </h2>
              <p className="text-sm text-muted-foreground text-pretty leading-relaxed">
                We use cookies to keep you securely signed in, understand how our platform supports maternal care workflows, and
                occasionally personalise content. You choose what you're comfortable with.{' '}
                <Link to="/cookies" target="_blank" className="text-primary underline-offset-2 hover:underline">
                  Cookie Policy
                </Link>
                {' · '}
                <Link to="/privacy" target="_blank" className="text-primary underline-offset-2 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>

          {/* Manage preferences expansion */}
          {expanded && (
            <div className="px-6 pb-4 space-y-3 border-t border-border pt-4">
              {/* Essential */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                    Essential Cookies
                    <span className="text-[10px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full ml-1">
                      Always on
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 text-pretty">
                    Required for secure authentication, session management, and core platform functionality.
                    Cannot be disabled.
                  </p>
                </div>
                <Switch checked disabled aria-label="Essential cookies always on" className="shrink-0 mt-0.5" />
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Analytics Cookies</p>
                  <p className="text-xs text-muted-foreground mt-0.5 text-pretty">
                    Help us understand how hospitals and care teams use the platform so we can improve workflows
                    and care coordination features.
                  </p>
                </div>
                <Switch
                  checked={analytics}
                  onCheckedChange={setAnalytics}
                  aria-label="Analytics cookies"
                  className="shrink-0 mt-0.5"
                />
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Marketing Cookies</p>
                  <p className="text-xs text-muted-foreground mt-0.5 text-pretty">
                    Used to measure the effectiveness of awareness campaigns about maternal health tools and
                    to deliver relevant information to healthcare providers.
                  </p>
                </div>
                <Switch
                  checked={marketing}
                  onCheckedChange={setMarketing}
                  aria-label="Marketing cookies"
                  className="shrink-0 mt-0.5"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-6 pb-6 pt-3 border-t border-border">
            {/* Manage toggle */}
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mr-auto"
              aria-expanded={expanded}
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? 'Hide preferences' : 'Manage preferences'}
            </button>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {expanded ? (
                <Button size="sm" onClick={saveCustom} className="sm:w-auto w-full">
                  Save preferences
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={rejectNonEssential}
                    className="sm:w-auto w-full"
                  >
                    Reject non-essential
                  </Button>
                  <Button size="sm" onClick={acceptAll} className="sm:w-auto w-full gap-1.5">
                    <Cookie className="w-3.5 h-3.5" aria-hidden />
                    Accept all
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Keyframes injected once */}
      <style>{`
        @keyframes cookie-fade-in  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cookie-fade-out { from { opacity: 1 } to { opacity: 0 } }
        @keyframes cookie-slide-in  { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes cookie-slide-out { from { opacity: 1; transform: translateY(0) } to { opacity: 0; transform: translateY(24px) } }
      `}</style>
    </>
  );
}
