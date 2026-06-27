import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { fadeUp, slideDown, viewport } from '@/lib/animations';

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

export default function TermsAndConditionsPage() {
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
          <Logo size="xs" />
        </div>
      </motion.header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-12">
        <motion.div className="mb-10" variants={fadeUp} initial="hidden" animate="visible">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Legal</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight text-balance mb-3">
            Terms and Conditions
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: <time dateTime="2026-06-25">{LAST_UPDATED}</time>
          </p>
          <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
            <strong className="text-foreground">Please read these terms carefully</strong> before using the Meds-inn platform.
            By accessing or using Meds-inn, you agree to be bound by the terms and conditions set out below.
          </div>
        </motion.div>

        <div className="prose-sm max-w-none">

          <Section title="1. Acceptance of Terms">
            <p>
              These Terms and Conditions ("Terms") constitute a legally binding agreement between you and Meds-inn Ltd
              ("Meds-inn", "we", "us") governing your access to and use of the Meds-inn maternal and child-care
              platform, including all associated mobile and web interfaces, APIs, and services (collectively, the
              "Platform").
            </p>
            <p>
              If you are accessing the Platform on behalf of a hospital, clinic, or other healthcare organisation,
              you represent that you have authority to bind that organisation to these Terms.
            </p>
          </Section>

          <Section title="2. Service Description">
            <p>
              Meds-inn is a B2B2C care coordination platform that enables subscribing hospitals and clinics to
              manage maternal and child-care continuity from conception through pregnancy, delivery, postpartum
              recovery, and a baby's first year. The Platform provides:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Patient enrolment, care plan management, and risk monitoring tools for clinical staff.</li>
              <li>Appointment scheduling, medication reminders, and follow-up coordination.</li>
              <li>AI-assisted care briefs to support clinical decision-making (see section 5).</li>
              <li>Secure messaging and video consultation infrastructure between care teams and patients.</li>
              <li>Baby care tracking, vaccination schedules, and developmental milestone logging.</li>
            </ul>
          </Section>

          <Section title="3. User Accounts and Roles">
            <p>Access to the Platform is role-gated. The four recognised roles are:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-foreground">Hospital Admin</strong> — full operational access including team management, analytics, and organisation-level settings.</li>
              <li><strong className="text-foreground">Nurse / Midwife</strong> — patient-facing care coordination access for assigned patients.</li>
              <li><strong className="text-foreground">Doctor</strong> — clinical review, care plan prescriptions, and video consultation access for assigned patients.</li>
              <li><strong className="text-foreground">Mother / Patient</strong> — read and interaction access limited to the patient's own care journey and communications.</li>
            </ul>
            <p>
              You are responsible for maintaining the confidentiality of your credentials and for all activity
              occurring under your account. Notify us immediately at{' '}
              <a href="mailto:security@meds-inn.health" className="text-primary underline-offset-2 hover:underline">
                security@meds-inn.health
              </a>{' '}
              if you suspect unauthorised access.
            </p>
          </Section>

          <Section title="4. Acceptable Use Policy">
            <p>You agree to use the Platform only for lawful purposes and in a manner that:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Supports genuine maternal and child healthcare delivery.</li>
              <li>Respects the privacy and dignity of patients and care team members.</li>
              <li>Complies with applicable healthcare regulations, professional standards, and data protection laws.</li>
            </ul>
            <p>You must not:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Share access credentials or permit unauthorised individuals to access patient data.</li>
              <li>Use the Platform to store, process, or transmit content that is unlawful, abusive, or defamatory.</li>
              <li>Attempt to circumvent security controls, scrape data, or reverse-engineer any part of the Platform.</li>
              <li>Use patient data for purposes outside the scope of direct care without explicit consent.</li>
            </ul>
          </Section>

          <Section title="5. Medical Disclaimer">
            <p>
              <strong className="text-foreground">Meds-inn is a care coordination tool, not a medical device or clinical decision support system requiring regulatory clearance.</strong>{' '}
              The Platform does not diagnose illness, prescribe medication, or replace the professional
              judgement of qualified healthcare practitioners.
            </p>
            <p>
              AI-generated care briefs are informational summaries derived from structured care data. They are
              intended to assist — not replace — clinical review. All AI outputs must be reviewed and validated
              by a licensed clinician before any clinical action is taken.
            </p>
            <p>
              In the event of a medical emergency, users should contact emergency services immediately. The
              Platform is not a substitute for emergency care.
            </p>
          </Section>

          <Section title="6. Intellectual Property">
            <p>
              All software, content, designs, trademarks, and trade names comprising the Platform are the
              exclusive property of Meds-inn Ltd or its licensors. Nothing in these Terms grants you any
              ownership rights to Platform content or intellectual property.
            </p>
            <p>
              You retain ownership of any patient care data and clinical notes entered into the Platform by
              your organisation. By using the Platform, you grant Meds-inn a limited, non-exclusive licence to
              process that data solely to provide the services described in these Terms.
            </p>
          </Section>

          <Section title="7. Data and Privacy">
            <p>
              Your use of the Platform is subject to our{' '}
              <Link to="/privacy" className="text-primary underline-offset-2 hover:underline">Privacy Policy</Link>
              , which is incorporated into these Terms by reference. We process health-related data as a
              data processor acting on behalf of the subscribing hospital (the data controller) in accordance
              with a separate data processing agreement.
            </p>
          </Section>

          <Section title="8. Payment Terms (Hospital Subscribers)">
            <p>
              Hospital subscriptions are billed on an annual or monthly basis as agreed in the order form.
              Fees are non-refundable except where required by law or expressly stated in writing.
            </p>
            <p>
              Meds-inn reserves the right to suspend access to the Platform if payment is not received within
              14 days of the due date, following written notice.
            </p>
          </Section>

          <Section title="9. Service Availability">
            <p>
              We target 99.5% monthly uptime for the Platform. Planned maintenance will be communicated at
              least 48 hours in advance. We are not liable for downtime caused by third-party infrastructure
              providers, force majeure events, or factors outside our reasonable control.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>
              To the fullest extent permitted by law, Meds-inn's aggregate liability for any claim arising
              out of or related to these Terms or the Platform shall not exceed the fees paid by you in the
              twelve months preceding the claim.
            </p>
            <p>
              We are not liable for indirect, incidental, consequential, or punitive damages, including loss
              of data, loss of revenue, or adverse clinical outcomes, even if we have been advised of the
              possibility of such damages.
            </p>
            <p>
              The Platform is provided "as is" without warranties of any kind, express or implied, including
              warranties of fitness for a particular medical purpose.
            </p>
          </Section>

          <Section title="11. Termination">
            <p>
              Either party may terminate the hospital subscription by providing 30 days' written notice.
              Meds-inn may terminate immediately for material breach of these Terms, including misuse of
              patient data.
            </p>
            <p>
              Upon termination, your access to the Platform will be suspended and, after a 90-day grace
              period, all organisation data will be deleted or returned as specified in the data processing
              agreement. Clinical records subject to statutory retention requirements will be handled
              accordingly.
            </p>
          </Section>

          <Section title="12. Dispute Resolution">
            <p>
              These Terms are governed by the laws of Nigeria. Any dispute arising from these Terms shall
              first be escalated to senior management of both parties for good-faith resolution. If unresolved
              within 30 days, the matter shall be referred to binding arbitration under the Rules of the
              Lagos Court of Arbitration.
            </p>
          </Section>

          <Section title="13. Changes to These Terms">
            <p>
              We may revise these Terms from time to time. Material changes will be communicated by email to
              the registered Hospital Admin at least 30 days before taking effect. Continued use of the
              Platform after that date constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="14. Contact Us">
            <p>Legal enquiries should be directed to:</p>
            <address className="not-italic space-y-1">
              <p><strong className="text-foreground">Email:</strong>{' '}<a href="mailto:legal@meds-inn.health" className="text-primary underline-offset-2 hover:underline">legal@meds-inn.health</a></p>
              <p><strong className="text-foreground">Address:</strong> Meds-inn Ltd, Care Innovation Hub, Lagos, Nigeria</p>
            </address>
          </Section>
        </div>
      </main>

      <footer className="border-t border-border mt-8">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 flex flex-wrap gap-4 items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 Meds-inn. All demo data is fictional.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
