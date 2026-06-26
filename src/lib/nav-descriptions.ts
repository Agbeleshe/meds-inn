/**
 * nav-descriptions.ts
 * Rich descriptions for each nav item used by the Joyride tour and
 * the inline ⓘ info-icon mini-tours on the sidebar.
 */

export const NAV_DESCRIPTIONS: Record<string, string> = {
  // ── Clinical / admin ──────────────────────────────────────────────────────
  'overview':
    'Your real-time command centre. See enrolled mother counts, high-risk flags, today\'s appointments, medication adherence rates, and team activity — all in one glance.',

  'mothers':
    'Your complete patient directory. Search, filter, and manage every enrolled mother by care stage, risk level, assigned nurse, or follow-up status. Click any row to open her full profile.',

  'appointments':
    'Schedule and manage all in-person and virtual appointments. Automated reminders go to mothers 24 h and 2 h before each visit. Switch between list and calendar views.',

  'care-plans':
    'Structured, trimester-by-trimester care plans built and maintained by your clinical team. Each plan is linked to a mother\'s profile and reviewed at every appointment.',

  'medications':
    'Clinician-assigned medication and supplement schedules delivered directly to mothers via the Meds-inn app. Track adherence rates per mother — drops below 70 % auto-flag.',

  'messages':
    'Secure, HIPAA-friendly messaging between your clinical team and enrolled mothers. All threads are stored in each patient record and visible to the assigned care team.',

  'video':
    'Conduct and document secure video consultations without leaving Meds-inn. Session notes, agenda items, and follow-up tasks are captured automatically at the end of each call.',

  'baby-care':
    'Extends care into the baby\'s first year. Track vaccinations, growth milestones, feeding notes, and paediatric appointments — all linked to the mother\'s profile.',

  'analytics':
    'Hospital-level performance data: care continuity scores, adherence trends, appointment completion rates, and team response times. Export any chart as CSV.',

  'team':
    'View and manage all clinical staff registered under your hospital account. Monitor each team member\'s caseload, response time, and adherence stats.',

  'ai-briefs':
    'Before each appointment, Meds-inn auto-generates a concise AI-assisted care brief for the assigned clinician — summarising activity, adherence trends, and risk cues. Advisory only.',

  'documents':
    'Centralised document storage for every patient — lab results, scan reports, consent forms, and care correspondence. Indexed by patient, type, and date.',

  'architecture':
    'A technical diagram of the infrastructure powering Meds-inn: Vercel frontend, AWS DynamoDB, Cognito auth, Bedrock AI, S3 storage, and Chime SDK video.',

  'settings':
    'Manage your hospital profile, notification preferences, team access controls, and third-party integration settings. Changes here apply to all users under your account.',

  // ── Mother / patient ──────────────────────────────────────────────────────
  'my-care':
    'Your personal care dashboard. See your pregnancy week, upcoming appointments, active medication reminders, care plan progress, and messages from your clinical team.',
};
