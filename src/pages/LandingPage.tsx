import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { HeartPulse, ArrowRight, CheckCircle2, ShieldCheck, Stethoscope, Users2, CalendarClock, Sparkles, Video, Bell, BarChart3, FolderOpen, Database, Cloud, Zap, Mail, Quote, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { HexagonalGalleryHero } from '@/components/landing/HexagonalGalleryHero';
import { fadeUp, fadeIn, staggerContainer, staggerSlow, slideDown, scaleIn, viewport } from '@/lib/animations';

const PROBLEMS = [
  'Mothers leave the clinic with instructions but no support system at home.',
  'Nurses have no structured way to follow up between appointments.',
  'Missed visits and low adherence go unnoticed until it is too late.',
  'Hospital staff spend hours on manual follow-up calls with no documentation.',
];

const SOLUTION_POINTS = [
  { icon: Bell, text: 'Clinician-managed medication reminders and care checklists sent directly to mothers.' },
  { icon: CalendarClock, text: 'Appointment scheduling, reminders, and missed-visit follow-up — all in one place.' },
  { icon: Video, text: 'Video consultations that bring the clinic to the mother, between visits.' },
  { icon: Sparkles, text: 'AI care briefs that surface patient risk cues and prepare clinicians for each visit.' },
  { icon: Stethoscope, text: 'Seamless transition from pregnancy care into baby\'s first-year follow-up.' },
  { icon: BarChart3, text: 'Hospital dashboards that show care continuity scores, adherence trends, and team performance.' },
];

const FEATURES = [
  { icon: Users2, title: 'Patient Directory', desc: 'Every enrolled mother, searchable and filterable by risk, stage, and follow-up status.' },
  { icon: Stethoscope, title: 'Care Plans', desc: 'Structured care plans created by clinicians, updated each trimester, reviewed by the care team.' },
  { icon: Bell, title: 'Medication Reminders', desc: 'Clinician-assigned reminders that reach mothers via the app. No automatic prescriptions.' },
  { icon: Video, title: 'Video Consultations', desc: 'Scheduled video calls with care notes, session agendas, and follow-up documentation built in.' },
  { icon: Sparkles, title: 'AI Care Briefs', desc: 'Summaries that consolidate patient activity, adherence, and risk cues for clinician review.' },
  { icon: FolderOpen, title: 'Document Centre', desc: 'Lab results, scans, consent forms, and care notes — organised and accessible to the care team.' },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Enrol',
    role: 'Hospital Admin',
    desc: 'Hospital staff enrol mothers at booking. Care plans, reminders, and team assignments are set up immediately.',
    color: 'bg-[hsl(173_79%_24%)]',
    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_fc0b4933-e01d-4fe5-bdc9-42c506fac535.jpg',
  },
  {
    step: '02',
    title: 'Monitor',
    role: 'Nurse / Midwife',
    desc: 'Nurses review daily care briefs, follow up on missed check-ins, and track medication adherence in real time.',
    color: 'bg-[hsl(207_85%_45%)]',
    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_3ddc9e2c-ec31-401f-915b-8905d5e90ae7.jpg',
  },
  {
    step: '03',
    title: 'Connect',
    role: 'Doctor',
    desc: 'Doctors conduct video consultations and receive AI-assisted summaries before each session.',
    color: 'bg-[hsl(38_53%_47%)]',
    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_755f0197-4351-4ccb-8dc6-7479783cc846.jpg',
  },
  {
    step: '04',
    title: 'Continue',
    role: 'Mother',
    desc: 'Care continues seamlessly from pregnancy through delivery, postpartum recovery, and baby\'s first vaccinations.',
    color: 'bg-[hsl(142_63%_35%)]',
    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b96611b0-ecff-4ff4-8a44-d1e9ae553627.jpg',
  },
];

const JOURNEY_STAGES = [
  { name: 'Conception', note: 'Enrolment and first care plan created.' },
  { name: 'First Trimester', note: 'Booking visit, first scans, supplement reminders.' },
  { name: 'Second Trimester', note: 'Growth monitoring, anomaly scan, adherence tracking.' },
  { name: 'Third Trimester', note: 'Birth plan, weekly nurse check-ins, delivery prep.' },
  { name: 'Delivery', note: 'Hospital admission documented, baby profile created.' },
  { name: 'Postpartum', note: '6-week recovery support and mental health check-ins.' },
  { name: "Baby's First Year", note: 'Vaccination schedule, growth milestones, paediatric visits.' },
];

const TESTIMONIALS = [
  {
    quote: 'Since we started using Meds-inn, our nurses have cut manual follow-up time by nearly half. The system flags missed visits before we even notice them.',
    name: 'Dr. Sarah Okafor',
    role: 'Medical Director',
    org: 'Elara Women\'s Specialist Clinic, London',
    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_d53eb03c-23ee-46af-b6a7-36be3a4964d5.jpg',
    type: 'hospital' as const,
  },
  {
    quote: 'Our care teams now start every shift knowing exactly which mothers need attention. The AI briefs have genuinely improved how we prepare for consultations.',
    name: 'Midwife Elena Costa',
    role: 'Head of Midwifery',
    org: 'Sunrise Maternity Centre, Toronto',
    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_1bd11433-b42e-43cd-95d2-fca294442593.jpg',
    type: 'hospital' as const,
  },
  {
    quote: 'My nurse sends me reminders every morning and checks in after every appointment. I felt cared for even when I was far from the hospital.',
    name: 'Sofia Marchetti',
    role: 'Mother, 29 weeks',
    org: 'Enrolled at Elara WSC, Milan',
    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_d64109aa-a7b6-43e7-91f6-6d8e5fb95b3c.jpg',
    type: 'mother' as const,
  },
  {
    quote: 'I used to forget my iron tablets. Now I get a gentle reminder every morning with instructions from my doctor. My last check-up showed a real improvement.',
    name: 'Mei Lin Zhang',
    role: 'Mother, postpartum',
    org: 'Enrolled at Bright Start Clinic, Singapore',
    img: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b1efac81-5850-4f26-a683-3be6c2809eae.jpg',
    type: 'mother' as const,
  },
];

const AWS_SERVICES = [
  { name: 'Vercel', note: 'Frontend deployment', icon: Cloud },
  { name: 'Amazon Cognito', note: 'Role-based auth', icon: ShieldCheck },
  { name: 'Amazon DynamoDB', note: 'Patient records', icon: Database },
  { name: 'Amazon S3', note: 'Documents & scans', icon: FolderOpen },
  { name: 'AWS Lambda', note: 'Reminder workflows', icon: Zap },
  { name: 'Amazon Bedrock', note: 'AI care briefs', icon: Sparkles },
  { name: 'Amazon Chime SDK', note: 'Video consultations', icon: Video },
  { name: 'Amazon SNS / SES', note: 'SMS & email alerts', icon: Mail },
];

const PRICING_TIERS = [
  { name: 'Starter', price: '$199', period: '/month', patients: 'Up to 50 mothers', features: ['Patient directory', 'Appointment scheduling', 'Medication reminders', 'Basic analytics'], cta: 'Start free trial' },
  { name: 'Clinical', price: '$499', period: '/month', patients: 'Up to 200 mothers', features: ['Everything in Starter', 'Video consultations', 'AI care briefs', 'Team management', 'Document centre'], cta: 'Request demo', highlight: true },
  { name: 'Hospital', price: 'Custom', period: '', patients: 'Unlimited', features: ['Everything in Clinical', 'Multi-department support', 'Custom integrations', 'Dedicated onboarding', 'SLA guarantee'], cta: 'Contact us' },
];

/* ── Animated workflow step ── */
function WorkflowStep({ step, index, total }: { step: typeof WORKFLOW_STEPS[0]; index: number; total: number }) {
  return (
    <motion.div
      className="flex flex-col items-center"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      transition={{ delay: index * 0.1 }}
    >
      {index > 0 && <div className="hidden lg:block absolute" />}
      <div className="relative mb-5">
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-card shadow-md">
          <img src={step.img} alt={step.role} className="w-full h-full object-cover" />
        </div>
        <span className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full ${step.color} flex items-center justify-center text-white text-[10px] font-bold border-2 border-card`}>
          {step.step}
        </span>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full text-white mb-3 ${step.color}`}>{step.role}</span>
      <h3 className="text-base font-bold text-foreground mb-2">{step.title}</h3>
      <p className="text-sm text-muted-foreground text-pretty leading-relaxed text-center max-w-[180px]">{step.desc}</p>
      {index < total - 1 && (
        <div className="hidden lg:flex absolute right-0 top-10 translate-x-1/2 items-center">
          <ArrowRight className="w-4 h-4 text-border" />
        </div>
      )}
    </motion.div>
  );
}

/* ── Testimonial card ── */
function TestimonialCard({ t, index }: { t: typeof TESTIMONIALS[0]; index: number }) {
  const accent = t.type === 'hospital' ? 'border-primary/30 bg-secondary/40' : 'border-[hsl(142_63%_35%)]/30 bg-[hsl(142_63%_35%)]/5';

  return (
    <motion.div
      className={`rounded-xl border p-6 flex flex-col h-full ${accent}`}
      variants={scaleIn}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      transition={{ delay: index * 0.08 }}
    >
      <Quote className="w-6 h-6 text-primary/30 mb-4 shrink-0" />
      <p className="text-sm text-foreground leading-relaxed text-pretty flex-1 mb-5">"{t.quote}"</p>
      <div className="flex items-center gap-3 mt-auto">
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border">
          <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
          <p className="text-xs text-muted-foreground truncate">{t.role} · {t.org}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <motion.nav
        className="sticky top-0 z-50 bg-card/90 backdrop-blur-sm border-b border-border"
        variants={slideDown} initial="hidden" animate="visible"
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <HeartPulse className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base tracking-tight">Meds-inn</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Stories</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[hsl(38_85%_62%)]" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-sm hidden sm:inline-flex">Sign in</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="text-sm">View demo</Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero — Hexagonal Gallery ── */}
      <HexagonalGalleryHero />

      {/* Stats bar */}
      <motion.div
        className="border-y border-border bg-card"
        variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewport}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Care stages covered', value: '8' },
            { label: 'Avg nurse response time', value: '< 4hrs' },
            { label: 'Medication adherence lift', value: '+22%' },
            { label: 'Missed visits detected', value: 'Real-time' },
          ].map(s => (
            <motion.div key={s.label} className="text-center" variants={fadeUp}>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Problem */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewport}>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 block">The gap</span>
            <h2 className="text-3xl font-bold text-foreground text-balance mb-4">
              The space between visits is where care often breaks.
            </h2>
            <p className="text-muted-foreground text-pretty leading-relaxed">
              Hospital care is excellent while mothers are in the clinic. But between appointments, there is no structured support — no reminders, no follow-up system, no way for nurses to monitor early warning signs.
            </p>
          </motion.div>
          <motion.div
            className="space-y-4"
            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewport}
          >
            {PROBLEMS.map((p, i) => (
              <motion.div key={i} variants={fadeUp} className="flex gap-3 items-start bg-card rounded-lg p-4 border border-border">
                <div className="w-2 h-2 rounded-full bg-destructive mt-2 shrink-0" />
                <p className="text-sm text-muted-foreground text-pretty">{p}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Solution */}
      <section id="solution" className="bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-20">
          <motion.div className="max-w-xl mb-12" variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewport}>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 block">How Meds-inn helps</span>
            <h2 className="text-3xl font-bold text-foreground text-balance mb-4">
              Care that continues after the clinic visit.
            </h2>
            <p className="text-muted-foreground text-pretty leading-relaxed">
              Meds-inn helps hospitals close the gap between clinic visits with a structured digital care layer for every enrolled mother.
            </p>
          </motion.div>
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewport}
          >
            {SOLUTION_POINTS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={i} variants={fadeUp} className="flex gap-4 p-5 rounded-lg border border-border bg-background">
                  <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-foreground text-pretty leading-relaxed">{s.text}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Animated Workflow ── */}
      <section id="workflow" className="max-w-6xl mx-auto px-4 md:px-8 py-20">
        <motion.div className="max-w-xl mb-14" variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewport}>
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 block">Hospital workflow</span>
          <h2 className="text-3xl font-bold text-foreground text-balance mb-3">
            A calmer way to coordinate maternal care.
          </h2>
          <p className="text-muted-foreground text-pretty leading-relaxed">
            Four roles. One shared mission. Every touchpoint documented automatically.
          </p>
        </motion.div>

        {/* desktop: horizontal with connectors */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-0 relative">
          <div className="absolute top-10 left-[calc(12.5%)] right-[calc(12.5%)] h-px bg-border" />
          {WORKFLOW_STEPS.map((step, i) => (
            <div key={step.step} className="relative flex flex-col items-center px-4">
              <WorkflowStep step={step} index={i} total={WORKFLOW_STEPS.length} />
            </div>
          ))}
        </div>

        {/* mobile: vertical stack */}
        <motion.div
          className="lg:hidden space-y-4"
          variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewport}
        >
          {WORKFLOW_STEPS.map((step, i) => (
            <motion.div key={step.step} variants={fadeUp} className="flex gap-5 items-start bg-card border border-border rounded-xl p-5">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-card shadow">
                  <img src={step.img} alt={step.role} className="w-full h-full object-cover" />
                </div>
                <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${step.color} flex items-center justify-center text-white text-[9px] font-bold border border-card`}>
                  {i + 1}
                </span>
              </div>
              <div className="min-w-0">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${step.color}`}>{step.role}</span>
                <h3 className="text-sm font-bold text-foreground mt-2 mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground text-pretty leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* second imagery strip */}
        <motion.div
          className="mt-16 grid md:grid-cols-2 gap-6"
          variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewport}
        >
          <motion.div variants={scaleIn} className="aspect-[16/7] rounded-xl overflow-hidden border border-border">
            <img src="https://miaoda-site-img.s3cdn.medo.dev/images/KLing_ae93649f-ea05-4166-9f90-84c363af7844.jpg" alt="Pregnant mother and nurse at antenatal clinic" className="w-full h-full object-cover" />
          </motion.div>
          <motion.div variants={scaleIn} className="aspect-[16/7] rounded-xl overflow-hidden border border-border">
            <img src="https://miaoda-site-img.s3cdn.medo.dev/images/KLing_94330f88-40e9-413b-aad4-dd790b2ac238.jpg" alt="Mother with newborn at hospital" className="w-full h-full object-cover" />
          </motion.div>
        </motion.div>
      </section>

      {/* Mother journey */}
      <section className="bg-sidebar">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-20">
          <motion.div className="max-w-xl mb-12" variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewport}>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 block">Mother journey</span>
            <h2 className="text-3xl font-bold text-sidebar-foreground text-balance">
              From pregnancy to first vaccinations, all in one care journey.
            </h2>
          </motion.div>
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3"
            variants={staggerSlow} initial="hidden" whileInView="visible" viewport={viewport}
          >
            {JOURNEY_STAGES.map((s, i) => (
              <motion.div key={i} variants={fadeUp} className={`rounded-lg p-4 border ${i === 2 ? 'border-primary bg-primary/10' : 'border-sidebar-border bg-sidebar-accent'}`}>
                <div className={`text-xs font-semibold mb-2 ${i === 2 ? 'text-primary' : 'text-sidebar-foreground'}`}>{s.name}</div>
                <p className="text-xs text-sidebar-foreground/60 text-pretty leading-relaxed">{s.note}</p>
                {i === 2 && <span className="inline-block mt-2 text-xs font-medium text-primary">● Current stage</span>}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="max-w-6xl mx-auto px-4 md:px-8 py-20">
        <motion.div className="max-w-xl mb-12" variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewport}>
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 block">Stories</span>
          <h2 className="text-3xl font-bold text-foreground text-balance mb-3">
            Trusted by hospitals. Loved by mothers.
          </h2>
          <p className="text-muted-foreground text-pretty leading-relaxed">
            Hear from the clinicians and mothers already using Meds-inn every day.
          </p>
        </motion.div>

        {/* Hospital testimonials */}
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">From hospitals</p>
          <div className="grid md:grid-cols-2 gap-5">
            {TESTIMONIALS.filter(t => t.type === 'hospital').map((t, i) => (
              <TestimonialCard key={t.name} t={t} index={i} />
            ))}
          </div>
        </div>

        {/* Mother testimonials */}
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">From mothers</p>
          <div className="grid md:grid-cols-2 gap-5">
            {TESTIMONIALS.filter(t => t.type === 'mother').map((t, i) => (
              <TestimonialCard key={t.name} t={t} index={i + 2} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-20">
          <motion.div className="max-w-xl mb-12" variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewport}>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 block">Platform features</span>
            <h2 className="text-3xl font-bold text-foreground text-balance">
              Every touchpoint, documented with clarity.
            </h2>
          </motion.div>
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewport}
          >
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={i} variants={fadeUp} className="bg-background rounded-lg border border-border p-6 h-full flex flex-col">
                  <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground text-pretty leading-relaxed flex-1">{f.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Architecture preview */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-20">
        <motion.div className="max-w-xl mb-12" variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewport}>
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 block">Infrastructure</span>
          <h2 className="text-3xl font-bold text-foreground text-balance">Built with Vercel + AWS.</h2>
          <p className="text-muted-foreground mt-3 text-pretty">Enterprise-grade architecture for a platform trusted by hospitals.</p>
        </motion.div>
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewport}
        >
          {AWS_SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={i} variants={fadeUp} className="flex flex-col items-start gap-2 p-4 rounded-lg border border-border bg-card">
                <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.note}</p>
              </motion.div>
            );
          })}
        </motion.div>
        <motion.div className="mt-8" variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewport}>
          <Link to="/dashboard/architecture">
            <Button variant="outline" size="sm" className="gap-2">View full architecture diagram <ArrowRight className="w-3.5 h-3.5" /></Button>
          </Link>
        </motion.div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-20">
          <motion.div className="max-w-xl mb-12" variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewport}>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 block">Pricing</span>
            <h2 className="text-3xl font-bold text-foreground text-balance">Simple pricing for every stage of your care programme.</h2>
          </motion.div>
          <motion.div
            className="grid md:grid-cols-3 gap-6"
            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewport}
          >
            {PRICING_TIERS.map((t) => (
              <motion.div key={t.name} variants={scaleIn} className={`rounded-lg border p-8 flex flex-col h-full ${t.highlight ? 'border-primary bg-secondary' : 'border-border bg-background'}`}>
                <div className="mb-6">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${t.highlight ? 'text-primary' : 'text-foreground'}`}>{t.price}</span>
                    {t.period && <span className="text-muted-foreground text-sm">{t.period}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t.patients}</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-8">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login">
                  <Button variant={t.highlight ? 'default' : 'outline'} className="w-full">{t.cta}</Button>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-sidebar border-t border-sidebar-border">
        <motion.div
          className="max-w-3xl mx-auto px-4 md:px-8 py-20 text-center"
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewport}
        >
          <h2 className="text-3xl font-bold text-sidebar-foreground text-balance mb-4">
            Ready to close the care gap?
          </h2>
          <p className="text-sidebar-foreground/60 text-pretty max-w-lg mx-auto mb-8 leading-relaxed">
            Join hospitals using Meds-inn to support mothers after every visit. Start with a free demo — no setup required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                Access demo <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-sidebar-foreground/40 mt-6">Continuous maternal care, beyond the clinic.</p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <HeartPulse className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">Meds-inn</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Meds-inn. Hackathon submission. All demo data is fictional.</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms &amp; Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}