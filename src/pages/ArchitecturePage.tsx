import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AsyncButton } from '@/components/common/AsyncButton';
import { fetchHealth, seedDatabase } from '@/lib/api-client';
import { toast } from 'sonner';
import { fadeUp, staggerContainer, viewport } from '@/lib/animations';
import {
  Server, Database, Shield, Cloud, Bell, Brain, Monitor,
  Globe, Layers, ArrowDown, ArrowRight, Users, Code2, Lock, ArrowLeft,
  FolderOpen, Calendar, Baby,
} from 'lucide-react';

interface ServiceCard {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  description: string;
  details: string[];
  status: 'live' | 'planned';
  color: string;
}

const STACK = [
  { label: 'Frontend', value: 'React 18 · TypeScript · Vite · Tailwind · shadcn/ui' },
  { label: 'Hosting', value: 'Vercel (SPA + serverless `/api/*` routes)' },
  { label: 'Database', value: 'Amazon DynamoDB — single table `meds-inn-db` (PK/SK composite keys)' },
  { label: 'AWS access', value: 'Vercel OIDC → `@vercel/oidc-aws-credentials-provider` (server-side only)' },
  { label: 'Auth (current)', value: 'Custom session tokens in localStorage · user records in DynamoDB' },
  { label: 'Local dev', value: '`npm run dev` — Vite + API on port 5173 via `scripts/dev.mjs`' },
];

/** Single-table entity layout — see `api/lib/items.ts` and `api/lib/dynamodb.ts` */
const DYNAMO_ENTITIES = [
  { prefix: 'HOSPITAL#', sk: 'METADATA', entity: 'Hospital', notes: 'Organisation profile and settings' },
  { prefix: 'USER#', sk: 'PROFILE', entity: 'User', notes: 'Admin, nurse, doctor, mother accounts' },
  { prefix: 'USER_LOOKUP#', sk: 'PROFILE', entity: 'User lookup', notes: 'O(1) login by username + hospital + role' },
  { prefix: 'MOTHER#', sk: 'PROFILE', entity: 'Mother', notes: 'Patient record, assignments, care stage' },
  { prefix: 'MOTHER#', sk: 'BABY#PROFILE', entity: 'Baby profile', notes: 'Mother-entered baby info (name, birth date, weights)' },
  { prefix: 'MOTHER#', sk: 'LAB#… / TIMELINE#… / MEDDOSE#…', entity: 'Mother sub-records', notes: 'Labs, timeline events, medication dose logs' },
  { prefix: 'APPOINTMENT#', sk: 'METADATA', entity: 'Appointment', notes: 'Specialist-created; past scheduled → missed' },
  { prefix: 'DOCUMENT#', sk: 'METADATA + CHUNK#NNNN', entity: 'Document', notes: 'Metadata + base64 chunks up to 10 MB per file' },
  { prefix: 'MEDICATION#', sk: 'METADATA', entity: 'Medication', notes: 'Prescriptions with schedule times and adherence' },
  { prefix: 'CHAT#', sk: 'METADATA / MSG#…', entity: 'Chat', notes: 'Threads and messages under thread partition' },
  { prefix: 'CAREPLAN#', sk: 'METADATA', entity: 'Care plan', notes: 'One plan per mother (sections + checklist)' },
  { prefix: 'TEAM#', sk: 'PROFILE', entity: 'Team member', notes: 'Clinical staff directory per hospital' },
  { prefix: 'WAITLIST#', sk: 'METADATA', entity: 'Waitlist', notes: 'Hospital signup interest emails' },
];

const API_ROUTES = [
  { group: 'Auth & users', routes: 'POST /api/auth/login · POST /api/auth/signup · GET /api/me · POST /api/onboarding/complete' },
  { group: 'Clinical data', routes: 'GET /api/mothers · GET/PATCH /api/mothers/:id · GET/POST /api/appointments · GET/POST/PATCH /api/medications' },
  { group: 'Documents & baby', routes: 'GET/POST /api/documents · GET/DELETE /api/documents/:id · GET/PUT /api/baby' },
  { group: 'Messaging', routes: 'GET/POST /api/messages/threads · GET/POST/PUT/PATCH /api/messages/threads/:id' },
  { group: 'Care & ops', routes: 'GET/PUT /api/care-plans/:motherId · GET /api/dashboard/metrics · GET /api/health · POST /api/seed' },
];

const SERVICES: ServiceCard[] = [
  {
    name: 'Vercel',
    icon: Cloud,
    category: 'Hosting & API',
    description: 'Hosts the React SPA and serverless API routes. DynamoDB credentials never reach the browser.',
    details: ['Edge CDN for static assets', 'Serverless `/api/*` handlers', 'Vercel Storage → DynamoDB link'],
    status: 'live',
    color: 'bg-secondary border-primary/20',
  },
  {
    name: 'Amazon DynamoDB',
    icon: Database,
    category: 'Database',
    description: 'Single-table design for all clinical data. Documents stored as chunked base64 items (10 MB max per file).',
    details: ['PK/SK mappers in api/lib/items.ts', 'Role-scoped reads via api/lib/access.ts', 'Scan + prefix filters at hackathon scale'],
    status: 'live',
    color: 'bg-[hsl(207_85%_95%)] border-[hsl(207_85%_60%)]',
  },
  {
    name: 'React + Vite',
    icon: Code2,
    category: 'Frontend',
    description: 'Client-side app with typed hooks that fetch `/api/*`. Empty states when no live data (demo fallback off by default).',
    details: ['useApiListQuery + DataSourceBadge', 'Bearer token in localStorage', 'Role-based nav and RouteGuard'],
    status: 'live',
    color: 'bg-secondary border-primary/20',
  },
  {
    name: 'Custom auth',
    icon: Shield,
    category: 'Authentication',
    description: 'Session tokens issued by POST /api/auth/login. User records and lookups stored in DynamoDB.',
    details: ['Roles: admin, nurse, doctor, mother', 'Assignment checks on every API route', 'Amazon Cognito planned for production'],
    status: 'live',
    color: 'bg-[hsl(142_63%_95%)] border-[hsl(142_63%_50%)]',
  },
  {
    name: 'Document storage',
    icon: FolderOpen,
    category: 'Files',
    description: 'Specialists upload to assigned mothers; files chunked in DynamoDB. Mothers download only; specialists can delete.',
    details: ['10 MB per file limit', 'CHUNK#0000… under DOCUMENT# partition', 'PDF, images, DOCX via base64 POST'],
    status: 'live',
    color: 'bg-[hsl(142_63%_95%)] border-[hsl(142_63%_50%)]',
  },
  {
    name: 'Amazon Bedrock',
    icon: Brain,
    category: 'AI / LLM',
    description: 'AI care brief generation grounded in patient records, with clinician review gates.',
    details: ['InvokeModel API', 'Brief stored in DynamoDB', 'Mock UI today'],
    status: 'planned',
    color: 'bg-secondary border-primary/20',
  },
  {
    name: 'Amazon SNS / SES',
    icon: Bell,
    category: 'Notifications',
    description: 'SMS and email for medication reminders, appointment alerts, and follow-ups.',
    details: ['Scheduled reminders', 'Template emails', 'Push via SNS'],
    status: 'planned',
    color: 'bg-[hsl(142_63%_95%)] border-[hsl(142_63%_50%)]',
  },
  {
    name: 'Amazon CloudWatch',
    icon: Monitor,
    category: 'Monitoring',
    description: 'Observability and audit logging across API routes and AWS services.',
    details: ['Lambda logs', 'Alarm thresholds', 'Compliance audit trail'],
    status: 'planned',
    color: 'bg-[hsl(207_85%_95%)] border-[hsl(207_85%_60%)]',
  },
];

const FLOW_ROWS = [
  {
    label: 'Clients',
    nodes: ['Mother (app)', 'Nurse (dashboard)', 'Doctor (dashboard)', 'Admin (dashboard)'],
    icon: Users,
  },
  {
    label: 'Browser',
    nodes: ['React SPA — Authorization: Bearer token on fetch `/api/*` (never AWS credentials)'],
    icon: Globe,
    span: true,
  },
  {
    label: 'Vercel serverless',
    nodes: ['api/lib/auth.ts → getUserRecordById · api/lib/access.ts → canAccessMother · @aws-sdk/lib-dynamodb'],
    icon: Layers,
    span: true,
  },
  {
    label: 'DynamoDB',
    nodes: ['meds-inn-db — single table, entityType + PK/SK per record'],
    icon: Database,
    span: true,
  },
];

const BUILD_STEPS = [
  {
    step: '01',
    title: 'Frontend + Vercel API',
    body: 'React + Vite dashboard with serverless `/api/*` handlers. The browser only talks to same-origin API routes — AWS SDK runs exclusively on the server.',
  },
  {
    step: '02',
    title: 'DynamoDB single-table model',
    body: 'All entities share one table (`meds-inn-db`). Partition keys encode entity type (MOTHER#, APPOINTMENT#, DOCUMENT#…). Sort keys distinguish profiles, metadata, and child records (MSG#, CHUNK#, LAB#).',
  },
  {
    step: '03',
    title: 'Role-scoped access',
    body: 'Every route validates Bearer token → loads USER# record → checks hospitalId and assignment via canAccessMother. Mothers see only their own patientId; nurses/doctors see assigned mothers only.',
  },
  {
    step: '04',
    title: 'Live features wired to DynamoDB',
    body: 'Appointments (create + auto-missed), documents (chunked upload/download), baby profiles, medications, chat threads, care plans, and dashboard metrics all persist through PutCommand / ScanCommand / GetCommand.',
  },
];

export default function ArchitecturePage() {
  const [health, setHealth] = useState<{
    ok: boolean;
    region: string | null;
    table: string | null;
    hasAwsRole: boolean;
  } | null>(null);

  const loadHealth = useCallback(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const handleSeed = async () => {
    try {
      const { seeded } = await seedDatabase();
      const total = Object.values(seeded).reduce((a, b) => a + b, 0);
      toast.success(
        `Seeded ${total} records — ${seeded.users} users, ${seeded.mothers} mothers, ${seeded.appointments} appointments`,
      );
      loadHealth();
    } catch {
      toast.error('Seed failed — run `npm run dev` and connect DynamoDB in Vercel Storage');
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16 space-y-12">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">How it was built</p>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance mb-4">
          Architecture
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl text-pretty leading-relaxed">
          Meds-inn is a React + Vite app on Vercel with serverless API routes backed by a single
          Amazon DynamoDB table. All clinical data — mothers, appointments, documents, medications,
          chat, and baby profiles — is stored as PK/SK items. The browser never holds AWS credentials.
        </p>
      </motion.div>

      <motion.div
        className="grid sm:grid-cols-2 gap-3"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
      >
        {STACK.map((row) => (
          <motion.div
            key={row.label}
            variants={fadeUp}
            className="rounded-xl border border-border bg-card px-4 py-3"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{row.label}</p>
            <p className="text-sm text-foreground">{row.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-2">DynamoDB data model</h2>
        <p className="text-sm text-muted-foreground mb-4">
          One table, many entity types. Keys are defined in{' '}
          <code className="text-foreground text-xs">api/lib/dynamodb.ts</code> and mapped in{' '}
          <code className="text-foreground text-xs">api/lib/items.ts</code>.
        </p>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left font-semibold text-muted-foreground px-4 py-2.5">Partition key (PK)</th>
                <th className="text-left font-semibold text-muted-foreground px-4 py-2.5">Sort key (SK)</th>
                <th className="text-left font-semibold text-muted-foreground px-4 py-2.5">Entity</th>
                <th className="text-left font-semibold text-muted-foreground px-4 py-2.5 hidden md:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody>
              {DYNAMO_ENTITIES.map((row) => (
                <tr key={`${row.prefix}-${row.sk}`} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-mono text-foreground">{row.prefix}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{row.sk}</td>
                  <td className="px-4 py-2.5 font-medium text-foreground">{row.entity}</td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">API routes</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {API_ROUTES.map((row) => (
            <div key={row.group} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-primary mb-1.5">{row.group}</p>
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">{row.routes}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-6">Build process</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {BUILD_STEPS.map((s) => (
            <div key={s.step} className="rounded-xl border border-border bg-card p-5">
              <span className="text-xs font-bold text-primary">{s.step}</span>
              <h3 className="text-sm font-semibold text-foreground mt-1 mb-2">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Request flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {FLOW_ROWS.map((row, ri) => {
              const Icon = row.icon;
              return (
                <div key={ri}>
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center shrink-0 pt-2">
                      <div className="w-8 h-8 rounded-lg bg-secondary border border-primary/20 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      {ri < FLOW_ROWS.length - 1 && (
                        <div className="w-px h-8 bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 pt-1.5">{row.label}</p>
                      {row.span ? (
                        <div className="bg-secondary border border-primary/10 rounded-lg px-4 py-2.5 text-sm text-foreground font-medium w-full max-w-lg">
                          {row.nodes[0]}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {row.nodes.map((node, ni) => (
                            <React.Fragment key={ni}>
                              <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground">
                                {node}
                              </div>
                              {ni < row.nodes.length - 1 && (
                                <ArrowRight className="w-3 h-3 text-muted-foreground/40 self-center hidden sm:block" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {ri < FLOW_ROWS.length - 1 && (
                    <div className="flex items-center gap-4 mb-0">
                      <div className="w-8 shrink-0" />
                      <ArrowDown className="w-3.5 h-3.5 text-primary/40 my-0" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { icon: Calendar, label: 'Appointments', text: 'Specialists POST new visits; GET auto-marks past scheduled as missed.' },
          { icon: FolderOpen, label: 'Documents', text: 'Chunked base64 in DOCUMENT#… CHUNK# items; 10 MB max per upload.' },
          { icon: Baby, label: 'Baby profile', text: 'MOTHER#{id} + SK BABY#PROFILE — filled by mother, read by care team.' },
        ].map(({ icon: Icon, label, text }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 flex gap-3">
            <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 rounded-xl border border-primary/20 bg-secondary/50 p-5">
        <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground mb-1">Security boundary</p>
          <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
            DynamoDB credentials stay on the server via Vercel OIDC. The React app sends{' '}
            <code className="text-foreground">Authorization: Bearer &lt;token&gt;</code> to{' '}
            <code className="text-foreground">/api/*</code> — same origin in dev and prod.
            Never use <code className="text-foreground">VITE_</code> prefix for AWS secrets.
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-2">Services &amp; status</h2>
        <p className="text-sm text-muted-foreground mb-6">What is wired to DynamoDB today vs planned for production.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((svc) => {
            const Icon = svc.icon;
            return (
              <div key={svc.name} className={`rounded-xl border p-5 flex flex-col h-full ${svc.color}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">{svc.name}</p>
                      <Badge variant="outline" className="text-xs mt-0.5 font-normal">{svc.category}</Badge>
                    </div>
                  </div>
                  <Badge variant={svc.status === 'live' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                    {svc.status === 'live' ? 'Live' : 'Planned'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed text-pretty mb-3 flex-1">
                  {svc.description}
                </p>
                <ul className="space-y-1">
                  {svc.details.map((d, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Try it — DynamoDB connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Connect DynamoDB in Vercel Dashboard → Storage, run{' '}
            <code className="text-foreground">npm run vercel:env</code>, then{' '}
            <code className="text-foreground">npm run dev</code>. Optionally seed baseline records, then open{' '}
            <Link to="/login" className="text-primary hover:underline">the dashboard</Link>
            {' '}and look for the <strong>Live · DynamoDB</strong> badge on data pages.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={health?.hasAwsRole ? 'default' : 'outline'} className="text-xs font-normal">
              {health?.hasAwsRole
                ? `Connected · ${health.table ?? 'meds-inn-db'} (${health.region ?? 'us-east-1'})`
                : 'Not connected — start `npm run dev` with `.env.local`'}
            </Badge>
            <Button size="sm" variant="outline" onClick={loadHealth}>
              Check health
            </Button>
            <AsyncButton size="sm" variant="outline" loadingText="Seeding…" onClick={handleSeed}>
              Seed baseline data
            </AsyncButton>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground/60 pb-4">
        Production deployment adds HIPAA BAA execution, Cognito auth, audit logging, and compliance review.
      </p>
    </main>
  );
}
