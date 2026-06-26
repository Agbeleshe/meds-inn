import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, HeartPulse } from 'lucide-react';
import { fadeUp, staggerContainer, slideDown, viewport } from '@/lib/animations';

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

export default function PrivacyPolicyPage() {
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
        {/* Page heading */}
        <motion.div className="mb-10" variants={fadeUp} initial="hidden" animate="visible">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Legal</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight text-balance mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: <time dateTime="2026-06-25">{LAST_UPDATED}</time>
          </p>
        </motion.div>

        <div className="prose-sm max-w-none">

          <Section title="1. Introduction">
            <p>
              Meds-inn ("we", "our", or "us") is committed to protecting the privacy and security of personal
              and health-related information entrusted to us by hospitals, clinicians, and the mothers and
              caregivers who use our platform. This Privacy Policy explains what information we collect, how we
              use it, and the choices available to you.
            </p>
            <p>
              This policy applies to all users of the Meds-inn platform, including hospital administrators,
              nurses, midwives, doctors, and mothers accessing care through a hospital subscription.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p><strong className="text-foreground">Account and profile information</strong> — name, email address, phone number, professional role, and organisation name provided during registration.</p>
            <p><strong className="text-foreground">Health and care data</strong> — for enrolled mothers: gestational age, medical history, allergy information, medication schedules, appointment records, care plan details, symptom logs, lab results, and uploaded documents such as ultrasound reports.</p>
            <p><strong className="text-foreground">Baby care data</strong> — birth details, growth measurements, vaccination records, and developmental milestone logs linked to a mother's account.</p>
            <p><strong className="text-foreground">Usage and device data</strong> — pages visited, features used, timestamps, browser type, IP address, and session identifiers collected automatically to maintain platform security and improve functionality.</p>
            <p><strong className="text-foreground">Communications</strong> — messages between care team members and patients within the platform's messaging system.</p>
            <p><strong className="text-foreground">Cookies and tracking technologies</strong> — see our <Link to="/cookies" className="text-primary underline-offset-2 hover:underline">Cookie Policy</Link> for full details.</p>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use collected information to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Provide, maintain, and improve the Meds-inn care coordination platform.</li>
              <li>Enable hospitals and clinicians to manage patient care plans, reminders, appointments, and follow-ups.</li>
              <li>Generate AI-assisted care briefs to support clinical decision-making (all AI outputs require clinician review).</li>
              <li>Send appointment reminders, medication alerts, and care notifications to enrolled mothers.</li>
              <li>Facilitate secure video consultations between patients and care team members.</li>
              <li>Analyse aggregate usage patterns to improve care workflows and platform performance.</li>
              <li>Comply with applicable legal, regulatory, and contractual obligations.</li>
            </ul>
          </Section>

          <Section title="4. Data Sharing and Disclosure">
            <p><strong className="text-foreground">Hospital care teams</strong> — patient data is shared with the assigned nurses, midwives, and doctors at the subscribing hospital. Access is governed by role-based permissions.</p>
            <p><strong className="text-foreground">Infrastructure providers</strong> — we use Amazon Web Services (AWS) and Vercel to host and deliver the platform. These providers process data on our behalf under data processing agreements and are not permitted to use it for their own purposes.</p>
            <p><strong className="text-foreground">Legal requirements</strong> — we may disclose data when required to do so by law, court order, or other governmental authority.</p>
            <p><strong className="text-foreground">Business transfers</strong> — in the event of a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction. We will notify you before your data is subject to a different privacy policy.</p>
            <p><strong className="text-foreground">We do not sell personal data</strong> to third parties for advertising or marketing purposes.</p>
          </Section>

          <Section title="5. Data Security">
            <p>
              We implement industry-standard security measures including encryption in transit (TLS) and at
              rest, strict access controls aligned to clinical roles, and regular security assessments of our
              infrastructure.
            </p>
            <p>
              Despite our measures, no system is completely secure. We encourage users to use strong passwords
              and to notify us immediately if they suspect unauthorised access to their account.
            </p>
          </Section>

          <Section title="6. Your Rights">
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-foreground">Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong className="text-foreground">Correction</strong> — request that inaccurate or incomplete data be corrected.</li>
              <li><strong className="text-foreground">Deletion</strong> — request deletion of your personal data, subject to legal retention requirements.</li>
              <li><strong className="text-foreground">Portability</strong> — receive your data in a structured, machine-readable format.</li>
              <li><strong className="text-foreground">Objection</strong> — object to certain types of data processing, including direct marketing.</li>
              <li><strong className="text-foreground">Cookie management</strong> — update your cookie preferences at any time via Settings or our <Link to="/cookies" className="text-primary underline-offset-2 hover:underline">Cookie Policy</Link> page.</li>
            </ul>
            <p>To exercise these rights, contact us at <a href="mailto:privacy@meds-inn.health" className="text-primary underline-offset-2 hover:underline">privacy@meds-inn.health</a>.</p>
          </Section>

          <Section title="7. Data Retention">
            <p>
              We retain health and care records for the period required by applicable medical records legislation
              in the relevant jurisdiction, or as agreed with the subscribing hospital — typically a minimum of
              seven years from the last care event.
            </p>
            <p>
              Account and usage data is retained for the duration of the hospital subscription and for up to
              two years after account closure, after which it is permanently deleted or anonymised.
            </p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>
              Baby care data (linked to a mother's account) is treated with the same level of protection as
              adult health data. We do not knowingly collect data directly from children. All baby-related data
              is entered and managed by a registered adult caregiver or healthcare professional.
            </p>
          </Section>

          <Section title="9. International Data Transfers">
            <p>
              Our infrastructure is hosted primarily in AWS regions. If data is transferred across international
              borders, we ensure that appropriate safeguards — such as standard contractual clauses — are in
              place to protect it to the same standard described in this policy.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. When we do, we will revise the "Last
              updated" date at the top of this page and, for material changes, notify subscribing hospitals
              by email at least 30 days before the change takes effect.
            </p>
          </Section>

          <Section title="11. Contact Us">
            <p>
              For privacy-related questions or to exercise your rights, contact our Data Protection team:
            </p>
            <address className="not-italic space-y-1">
              <p><strong className="text-foreground">Email:</strong>{' '}<a href="mailto:privacy@meds-inn.health" className="text-primary underline-offset-2 hover:underline">privacy@meds-inn.health</a></p>
              <p><strong className="text-foreground">Address:</strong> Meds-inn Ltd, Care Innovation Hub, Lagos, Nigeria</p>
            </address>
          </Section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 flex flex-wrap gap-4 items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 Meds-inn. All demo data is fictional.</span>
          <div className="flex gap-4">
            <Link to="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms &amp; Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
