import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { LogoMark } from '@/components/common/Logo';
import { resolveLoadingMessage, resolvePageLabel } from '@/lib/page-labels';
import { pickRandomPregnancyFact } from '@/lib/pregnancy-facts';
import { useAuth } from '@/contexts/AuthContext';

interface PageLoadingContextValue {
  setPageLoading: (id: string, loading: boolean) => void;
}

const PageLoadingContext = createContext<PageLoadingContextValue | null>(null);

const ENTER_MS = 700;
const EXIT_MS = 350;
const PREMIUM_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export function PageLoadingProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const loadersRef = useRef(new Set<string>());
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const [entering, setEntering] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [pregnancyFact, setPregnancyFact] = useState(pickRandomPregnancyFact);

  const pageLabel = useMemo(
    () => resolvePageLabel(location.pathname),
    [location.pathname],
  );

  const loadingMessage = useMemo(
    () => resolveLoadingMessage(location.pathname),
    [location.pathname],
  );

  const { user } = useAuth();
  const showPregnancyTips =
    user?.role === 'mother' && location.pathname.startsWith('/dashboard');

  const factStage: 'pregnant' | 'postpartum' =
    user?.careStage === 'postpartum' ? 'postpartum' : 'pregnant';

  const setPageLoading = useCallback((id: string, loading: boolean) => {
    if (loading) loadersRef.current.add(id);
    else loadersRef.current.delete(id);

    const nowActive = loadersRef.current.size > 0;
    setActive(nowActive);

    if (nowActive) {
      setExiting(false);
      setVisible((wasVisible) => {
        if (!wasVisible) {
          setEntering(true);
          if (showPregnancyTips) setPregnancyFact(pickRandomPregnancyFact(factStage));
        }
        return true;
      });
    }
  }, [showPregnancyTips, factStage]);

  useEffect(() => {
    if (!visible || !entering) return;

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntering(false));
    });

    return () => cancelAnimationFrame(id);
  }, [visible, entering]);

  useEffect(() => {
    if (active || !visible) return;

    setExiting(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      setExiting(false);
      setEntering(false);
    }, EXIT_MS);

    return () => window.clearTimeout(timer);
  }, [active, visible]);

  const value = useMemo(() => ({ setPageLoading }), [setPageLoading]);

  return (
    <PageLoadingContext.Provider value={value}>
      <AuthSessionLoadingBridge />
      {children}
      <PageLoadingOverlay
        visible={visible}
        entering={entering}
        exiting={exiting}
        pageLabel={pageLabel}
        loadingMessage={loadingMessage}
        pregnancyFact={pregnancyFact}
        showPregnancyTips={showPregnancyTips}
      />
    </PageLoadingContext.Provider>
  );
}

/** Registers initial session restore on auth and dashboard routes. */
function AuthSessionLoadingBridge() {
  const { loading } = useAuth();
  const { pathname } = useLocation();

  const shouldRegister =
    loading &&
    (pathname.startsWith('/dashboard') ||
      pathname === '/login' ||
      pathname === '/signup');

  usePageLoadingRegistration(shouldRegister);
  return null;
}

export function usePageLoadingRegistration(loading: boolean) {
  const id = useId();
  const ctx = useContext(PageLoadingContext);

  useEffect(() => {
    if (!ctx) return;
    ctx.setPageLoading(id, loading);
    return () => ctx.setPageLoading(id, false);
  }, [id, loading, ctx]);
}

function PageLoadingOverlay({
  visible,
  entering,
  exiting,
  pageLabel,
  loadingMessage,
  pregnancyFact,
  showPregnancyTips,
}: {
  visible: boolean;
  entering: boolean;
  exiting: boolean;
  pageLabel: string;
  loadingMessage: string;
  pregnancyFact: string;
  showPregnancyTips: boolean;
}) {
  if (!visible) return null;

  const shown = !entering && !exiting;
  const durationMs = exiting ? EXIT_MS : ENTER_MS;
  const transition = `opacity ${durationMs}ms ${exiting ? 'ease-in' : PREMIUM_EASE}, transform ${durationMs}ms ${exiting ? 'ease-in' : PREMIUM_EASE}, backdrop-filter ${durationMs}ms ${PREMIUM_EASE}`;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      role="status"
      aria-live="polite"
      aria-busy={!exiting}
      aria-label={`Loading ${pageLabel}`}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        style={{
          opacity: shown ? 1 : 0,
          transition,
        }}
      />

      <div
        className="relative w-full max-w-sm rounded-xl border border-border/80 bg-card px-8 py-8 text-center shadow-xl"
        style={{
          opacity: shown ? 1 : 0,
          transform: shown
            ? 'scale(1) translateY(0)'
            : exiting
              ? 'scale(0.96) translateY(8px)'
              : 'scale(0.92) translateY(20px)',
          transition,
        }}
      >
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 shadow-[0_8px_32px_hsl(var(--primary)/0.25)]">
          <LogoMark size="splash" className="!h-14 !w-14 animate-pulse" />
        </div>

        <p className="text-lg font-semibold tracking-tight text-foreground">Meds-inn</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {loadingMessage}
        </p>

        {showPregnancyTips && (
          <div className="mt-5 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Do you know?
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {pregnancyFact}
            </p>
          </div>
        )}

        <Loader2 className="mx-auto mt-5 h-5 w-5 animate-spin text-primary" aria-hidden />
      </div>
    </div>
  );
}
