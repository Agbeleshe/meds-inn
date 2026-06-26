import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fadeUp, slideDown, staggerContainer, viewport } from '@/lib/animations';

const LAST_UPDATED = 'June 25, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section
      className="mb-10"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
    >
      <h2 className="text-xl font-semibold text-foreground mb-3 text-balance">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </motion.section>
  );
}

function CookieTable({ rows }: { rows: { name: string; purpose: string; duration: string; category: string }[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border mt-3">
      <table className="w-full text-xs min-w-max">
        <thead>
          <tr className="bg-muted text-muted-foreground">
            <th className="text-left px-4 py-2.5 font-medium whitespace-nowrap">Cookie name</th>
            <th className="text-left px-4 py-2.5 font-medium whitespace-nowrap">Purpose</th>
            <th className="text-left px-4 py-2.5 font-medium whitespace-nowrap">Duration</th>
            <th className="text-left px-4 py-2.5 font-medium whitespace-nowrap">Category</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(r => (
            <tr key={r.name} className="bg-card hover:bg-muted/40 transition-colors">
              <td className="px-4 py-2.5 font-mono text-foreground whitespace-nowrap">{r.name}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{r.purpose}</td>
              <td className="px-4 py-2.5 whitespace-nowrap">{r.duration}</td>
              <td className="px-4 py-2.5 whitespace-nowrap">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold
                  ${r.category === 'Essential' ? 'bg-primary/10 text-primary' :
                    r.category === 'Analytics' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                    'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                  {r.category}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const COOKIE_ROWS = [
  { name: 'medinn_session', purpose: 'Maintains your authenticated session securely', duration: 'Session', category: 'Essential' },
  { name: 'medinn_role',    purpose: 'Stores your selected demo role for consistent navigation', duration: '7 days', category: 'Essential' },
  { name: 'medinn_theme',   purpose: 'Remembers your light/dark mode preference', duration: '1 year', category: 'Essential' },
  { name: 'medinn_cookie_consent', purpose: 'Records your cookie preferences', duration: '1 year', category: 'Essential' },
  { name: '_vercel_analytics', purpose: 'Aggregated, anonymised page performance data', duration: '30 days', category: 'Analytics' },
  { name: '_va_session', purpose: 'Groups page views within a single visit for analytics', duration: 'Session', category: 'Analytics' },
  { name: '_aws_waf',    purpose: 'AWS WAF security token to protect the platform from abuse', duration: 'Session', category: 'Essential' },
  { name: 'medinn_mkt',  purpose: 'Tracks referral source for healthcare provider campaigns', duration: '90 days', category: 'Marketing' },
];

export default function CookiePolicyPage() {
  function openConsentManager() {
    try { localStorage.removeItem('medinn_cookie_consent'); } catch { /* noop */ }
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <motion.header
        className="border-b border-border bg-card sticky top-0 z-10"
        variants={slideDown} initial="hidden" animate="visible"
      >
        <div className="max-w-3xl mx-auto px-4 md:px-8 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <span className="text-border select-none">|</span>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <HeartPulse className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">Meds-inn</span>
          </div>
        </div>
      </motion.header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-12">
        <motion.div className="mb-10" variants={fadeUp} initial="hidden" animate="visible">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Legal</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight text-balance mb-3">
            Cookie Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: <time dateTime="2026-06-25">{LAST_UPDATED}</time>
          </p>
        </motion.div>

        <div className="prose-sm max-w-none">

          <Section title="1. What Are Cookies?">
            <p>
              Cookies are small text files placed on your device when you visit a website or web application.
              They allow the platform to remember your preferences, keep you signed in, and understand how
              features are being used — helping us continuously improve the care coordination experience for
              hospitals and mothers.
            </p>
          </Section>

          <Section title="2. Types of Cookies We Use">
            <p><strong className="text-foreground">Essential Cookies</strong> — required for the platform to function. They enable authentication, secure session management, and your theme and role preferences. You cannot opt out of essential cookies without losing core functionality.</p>
            <p><strong className="text-foreground">Analytics Cookies</strong> — collect anonymised, aggregated data about how users navigate the platform so we can identify areas for improvement. No personally identifiable information is shared with analytics providers.</p>
            <p><strong className="text-foreground">Marketing Cookies</strong> — used to measure the effectiveness of outreach campaigns targeting healthcare providers and to avoid showing repetitive information. These are optional and off by default.</p>
          </Section>

          <Section title="3. Cookie Details">
            <CookieTable rows={COOKIE_ROWS} />
          </Section>

          <Section title="4. Third-Party Cookies">
            <p>
              Some cookies are set by third-party services we rely on to deliver Meds-inn:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-foreground">Vercel</strong> — edge network and analytics. Vercel's own privacy policy applies to data collected via their infrastructure.</li>
              <li><strong className="text-foreground">Amazon Web Services</strong> — our cloud platform. AWS WAF sets a security token to protect against automated threats.</li>
              <li><strong className="text-foreground">Amazon Chime SDK</strong> — video consultation functionality. Session cookies are used only during active video calls.</li>
            </ul>
            <p>We do not embed third-party advertising networks or social media trackers on the platform.</p>
          </Section>

          <Section title="5. Managing Your Cookie Preferences">
            <p>
              You can update your cookie preferences at any time using the button below. This resets your
              stored choice and shows the consent manager again on your next page load.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={openConsentManager}
              className="mt-1"
            >
              Manage cookie preferences
            </Button>
            <p className="mt-3">
              You can also control cookies at the browser level. Please note that disabling all cookies will
              prevent you from staying signed in and may impair core care coordination features.
            </p>
          </Section>

          <Section title="6. Do Not Track">
            <p>
              Some browsers transmit a "Do Not Track" (DNT) signal. We currently respond to DNT signals by
              disabling analytics and marketing cookies for that session, equivalent to the "Reject
              non-essential" choice in our consent manager.
            </p>
          </Section>

          <Section title="7. Updates to This Policy">
            <p>
              We may update this Cookie Policy as we introduce new features or change our third-party
              partners. The "Last updated" date at the top of this page reflects the most recent revision.
              Material changes will be communicated via an updated consent notice on first visit.
            </p>
          </Section>

          <Section title="8. Contact Us">
            <p>
              Questions about how we use cookies?{' '}
              <a href="mailto:privacy@meds-inn.health" className="text-primary underline-offset-2 hover:underline">
                privacy@meds-inn.health
              </a>
            </p>
          </Section>
        </div>
      </main>

      <footer className="border-t border-border mt-8">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 flex flex-wrap gap-4 items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 Meds-inn. All demo data is fictional.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms &amp; Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
