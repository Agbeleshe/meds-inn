import { NAV_ITEMS, MOTHER_NAV_ITEMS } from './nav-items.js';

const EXTRA_LABELS: Record<string, string> = {
  '/login': 'Sign In',
  '/signup': 'Sign Up',
  '/dashboard/onboarding': 'Onboarding',
  '/dashboard/escalated': 'Escalated Cases',
  '/dashboard/timeline': 'Pregnancy Timeline',
  '/dashboard/symptoms': 'Symptom Log',
  '/dashboard/video-calls': 'Video Calls',
  '/architecture': 'Architecture',
};

/** Resolve a human-readable page title from the current route. */
export function resolvePageLabel(pathname: string): string {
  if (EXTRA_LABELS[pathname]) return EXTRA_LABELS[pathname];

  const videoCall = pathname.match(/^\/dashboard\/video\/[^/]+$/);
  if (videoCall) return 'Video Consultation';

  const motherProfile = pathname.match(/^\/dashboard\/mothers\/[^/]+$/);
  if (motherProfile) return 'Mother Profile';

  const all = [...NAV_ITEMS, ...MOTHER_NAV_ITEMS];
  const sorted = [...all].sort((a, b) => b.path.length - a.path.length);

  for (const item of sorted) {
    if (pathname === item.path || pathname.startsWith(`${item.path}/`)) {
      return item.label;
    }
  }

  if (pathname === '/dashboard') return 'Overview';
  return 'this page';
}

/** Primary loading message shown in the page overlay. */
export function resolveLoadingMessage(pathname: string): string {
  if (pathname === '/login') {
    return 'We are signing you in. Please wait…';
  }
  if (pathname === '/signup') {
    return 'We are signing you up. Please wait…';
  }

  const pageLabel = resolvePageLabel(pathname);
  return `We are loading content of ${pageLabel}. Please wait…`;
}
