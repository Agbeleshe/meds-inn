/**
 * SplashScreen — v2
 *
 * Shows while image assets are being preloaded.
 * Displays a live progress bar + loaded/total counter.
 * Transitions: fade-in → loading → "Ready!" flash → fade-out → onDone().
 *
 * Props
 *  onDone      called once fade-out completes
 *  progress    0–100; when ≥ 100 the "Ready!" state plays then we fade out
 *  loaded      number of images loaded so far
 *  total       total number of images to load
 */

import React, { useEffect, useRef, useState } from 'react';
import { HeartPulse, CheckCircle2 } from 'lucide-react';

interface SplashScreenProps {
  onDone: () => void;
  progress: number;   // 0–100
  loaded: number;
  total: number;
}

/** Minimum time the splash is visible even on very fast connections (ms) */
const MIN_DISPLAY_MS = 1_400;

export function SplashScreen({ onDone, progress, loaded, total }: SplashScreenProps) {
  const [phase, setPhase] = useState<'in' | 'loading' | 'ready' | 'out'>('in');
  const startedAt = useRef(Date.now());
  const doneRef = useRef(false);

  // Fade in completes at ~500ms → switch to loading phase
  useEffect(() => {
    const t = setTimeout(() => setPhase('loading'), 500);
    return () => clearTimeout(t);
  }, []);

  // When progress hits 100 → wait for minimum display time, then "ready" flash → fade out
  useEffect(() => {
    if (progress < 100 || doneRef.current) return;
    doneRef.current = true;

    const elapsed = Date.now() - startedAt.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    const t1 = setTimeout(() => setPhase('ready'), remaining);
    const t2 = setTimeout(() => setPhase('out'), remaining + 700);
    const t3 = setTimeout(() => onDone(), remaining + 700 + 600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [progress, onDone]);

  const isOut = phase === 'out';
  const isReady = phase === 'ready' || phase === 'out';

  return (
    <div
      aria-live="polite"
      aria-label="Loading Meds-inn"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'hsl(var(--background))',
        transition: isOut ? 'opacity 600ms ease-in-out' : 'opacity 500ms ease-out',
        opacity: isOut ? 0 : 1,
        pointerEvents: isOut ? 'none' : 'all',
        padding: '0 24px',
      }}
    >
      {/* ── Animated logo mark ── */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: isReady ? 'hsl(var(--primary))' : 'hsl(var(--primary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          boxShadow: '0 8px 32px hsl(var(--primary) / 0.35)',
          animation: isReady ? 'splash-pop 0.4s ease-out forwards' : 'splash-pulse 2s ease-in-out infinite',
          transition: 'box-shadow 0.3s',
        }}
      >
        {isReady ? (
          <CheckCircle2
            style={{ width: 40, height: 40, color: 'hsl(var(--primary-foreground))' }}
            strokeWidth={1.8}
          />
        ) : (
          <HeartPulse
            style={{ width: 40, height: 40, color: 'hsl(var(--primary-foreground))' }}
            strokeWidth={1.8}
          />
        )}
      </div>

      {/* ── Brand name ── */}
      <span
        style={{
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'hsl(var(--foreground))',
          fontFamily: 'inherit',
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        Meds-inn
      </span>

      {/* ── Tagline ── */}
      <span
        style={{
          fontSize: 13,
          color: 'hsl(var(--muted-foreground))',
          letterSpacing: '0.05em',
          fontWeight: 500,
          marginBottom: 40,
          textAlign: 'center',
        }}
      >
        Continuous maternal care, beyond the clinic.
      </span>

      {/* ── Progress track ── */}
      <div
        style={{
          width: '100%',
          maxWidth: 280,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          opacity: phase === 'in' ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}
      >
        {/* Bar */}
        <div
          style={{
            width: '100%',
            height: 4,
            borderRadius: 99,
            background: 'hsl(var(--muted))',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: 99,
              background: 'hsl(var(--primary))',
              width: `${Math.min(progress, 100)}%`,
              transition: 'width 0.3s ease-out',
            }}
          />
        </div>

        {/* Status text */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 20,
          }}
        >
          {isReady ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'hsl(var(--primary))',
                letterSpacing: '0.04em',
                animation: 'splash-fade-in 0.3s ease',
              }}
            >
              Ready
            </span>
          ) : (
            <>
              <LoadingDots />
              <span
                style={{
                  fontSize: 12,
                  color: 'hsl(var(--muted-foreground))',
                  letterSpacing: '0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {total > 0
                  ? `Loading images… ${loaded} / ${total}`
                  : 'Preparing…'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes splash-pulse {
          0%, 100% { transform: scale(1);    box-shadow: 0 8px 32px hsl(var(--primary) / 0.35); }
          50%       { transform: scale(1.07); box-shadow: 0 12px 40px hsl(var(--primary) / 0.5); }
        }
        @keyframes splash-pop {
          0%   { transform: scale(0.85); }
          60%  { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes splash-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/** Three animated dots */
function LoadingDots() {
  return (
    <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'hsl(var(--primary))',
            display: 'inline-block',
            animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

