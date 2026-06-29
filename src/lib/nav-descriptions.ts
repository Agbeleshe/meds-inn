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
    'Schedule and manage in-person appointments. Automated reminders go to mothers before each visit. Past scheduled visits are marked missed automatically.',

  'care-plans':
    'Structured, trimester-by-trimester care plans built and maintained by your clinical team. Each plan is linked to a mother\'s profile and reviewed at every appointment.',

  'medications':
    'Clinician-assigned medication and supplement schedules delivered directly to mothers via the Meds-inn app. Track adherence rates per mother — drops below 70 % auto-flag.',

  'messages':
    'Secure, HIPAA-friendly messaging between your clinical team and enrolled mothers. All threads are stored in each patient record and visible to the assigned care team.',

  'baby-care':
    'Extends care into the baby\'s first year. Track vaccinations, growth milestones, feeding notes, and paediatric appointments — all linked to the mother\'s profile.',

  'analytics':
    'Hospital-level performance data: care continuity scores, adherence trends, appointment completion rates, and team response times. Export any chart as CSV.',

  'team':
    'View and manage all clinical staff registered under your hospital account. Monitor each team member\'s caseload, response time, and adherence stats.',

  'ai-briefs':
    'AI-assisted care briefs for your assigned patients — summarising adherence, secure messaging, medications, and risk cues before each visit. Administrators see all enrolled mothers. Advisory only; requires clinician review.',

  'documents':
    'Documents stored in DynamoDB — specialists upload lab results and reports for assigned mothers; mothers can download.',

  'architecture':
    'Technical overview: Vercel frontend, serverless API routes, single-table DynamoDB data model, role-scoped access, and document chunk storage.',

  'settings':
    'Manage your hospital profile, notification preferences, team access controls, and third-party integration settings. Changes here apply to all users under your account.',

  // ── Mother / patient ──────────────────────────────────────────────────────
  'my-care':
    'Your personal care dashboard. See your pregnancy week, upcoming appointments, active medication reminders, care plan progress, and messages from your clinical team.',

  'care-tasks':
    'Your daily care checklist assigned by your nurse or doctor. Complete today\'s tasks, see yesterday\'s performance, and track how well you follow your plan.',

  'my-specialist':
    'Your assigned obstetric specialist or midwife. View their profile, request a change, report a concern, or ask for a video consultation.',

  'video-calls':
    'Secure video consultations with your care team. Join scheduled calls, review session notes, and request a video visit when you need to speak face-to-face.',

  'symptoms':
    'Log symptoms between visits so your nurse or doctor can review patterns. Severity and notes help your team respond before your next appointment.',

  'waiting-list':
    'Mothers who have requested a specialist assignment and are awaiting a nurse or doctor. Assign staff from here to begin their care journey.',

  'escalated':
    'Cases flagged as urgent or serious by mothers or clinicians. Review escalation notes, assign follow-up, and resolve once the concern is addressed.',

  'notifications':
    'All alerts in one place — appointment reminders, medication nudges, care plan updates, messages, and clinical notifications. Mark as read or jump to the source.',

  'timeline':
    'Your pregnancy journey from conception through delivery and into baby\'s first year. See completed milestones and what comes next at each stage.',
};
