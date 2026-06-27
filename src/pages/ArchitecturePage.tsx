import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchHealth, seedDatabase } from '@/lib/api-client';
import { toast } from 'sonner';
import { fadeUp, staggerContainer, viewport } from '@/lib/animations';
import {
  Server, Database, Shield, Cloud, Bell, Video, Brain, Monitor,
  Globe, Layers, ArrowDown, ArrowRight, Users, Code2, Lock, ArrowLeft,
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
  { label: 'Database', value: 'Amazon DynamoDB — single table `meds-inn-db` (PK/SK)' },
  { label: 'AWS auth', value: 'Vercel OIDC → `@vercel/oidc-aws-credentials-provider`' },
  { label: 'Local dev', value: '`npm run dev` — Vite + API on port 5173 via `scripts/dev.mjs`' },
];

const SERVICES: ServiceCard[] = [
  {
    name: 'Vercel',
    icon: Cloud,
    category: 'Hosting & API',
    description: 'Hosts the React SPA and serverless API routes. DynamoDB credentials never reach the browser.',
    details: ['Edge CDN for static assets', 'Serverless `/api/*` handlers', 'Vercel Storage → DynamoDB'],
    status: 'live',
    color: 'bg-secondary border-primary/20',
  },
  {
    name: 'Amazon DynamoDB',
    icon: Database,
    category: 'Database',
    description: 'Single-table design for mothers, appointments, medications, messages, documents, and labs.',
    details: ['PK/SK composite keys', 'Scan + prefix filters (hackathon scale)', 'Seeded via POST /api/seed'],
    status: 'live',
    color: 'bg-[hsl(207_85%_95%)] border-[hsl(207_85%_60%)]',
  },
  {
    name: 'React + Vite',
    icon: Code2,
    category: 'Frontend',
    description: 'Client-side app with typed hooks (`useApiListQuery`) that fetch `/api/*` with demo fallback.',
    details: ['React Router v6', 'Context for theme & roles', 'DataSourceBadge on live pages'],
    status: 'live',
    color: 'bg-secondary border-primary/20',
  },
  {
    name: 'Amazon Cognito',
    icon: Shield,
    category: 'Authentication',
    description: 'Target auth for production — role-based access for admin, nurse, doctor, and mother.',
    details: ['JWT sessions', 'Role groups', 'Replaces demo role switcher'],
    status: 'planned',
    color: 'bg-[hsl(38_92%_96%)] border-[hsl(38_70%_60%)]',
  },
  {
    name: 'Amazon S3',
    icon: Server,
    category: 'File Storage',
    description: 'Presigned uploads for medical documents; metadata stored in DynamoDB.',
    details: ['Signed URL access', 'Server-side encryption', 'Documents page integration'],
    status: 'planned',
    color: 'bg-[hsl(38_92%_96%)] border-[hsl(38_70%_60%)]',
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
    name: 'Amazon Chime SDK',
    icon: Video,
    category: 'Video',
    description: 'HIPAA-eligible video consultations between clinicians and mothers.',
    details: ['WebRTC sessions', 'Linked to appointments', 'Mock UI today'],
    status: 'planned',
    color: 'bg-[hsl(142_63%_95%)] border-[hsl(142_63%_50%)]',
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
    nodes: ['React SPA — fetch `/api/*` only (never talks to AWS directly)'],
    icon: Globe,
    span: true,
  },
  {
    label: 'Vercel serverless',
    nodes: ['`/api/mothers` · `/api/appointments` · `/api/seed` · `/api/health`'],
    icon: Layers,
    span: true,
  },
  {
    label: 'AWS',
    nodes: ['DynamoDB (live)', 'OIDC credentials', 'Cognito (planned)', 'S3 · Bedrock · Chime · SNS/SES'],
    icon: Server,
  },
];

const BUILD_STEPS = [
  {
    step: '01',
    title: 'Frontend scaffold',
    body: 'React + Vite + TypeScript with Tailwind and shadcn/ui. All dashboard pages share layouts, hooks, and demo data while AWS routes are wired page by page.',
  },
  {
    step: '02',
    title: 'Vercel + DynamoDB',
    body: 'Linked Vercel project, created `meds-inn-db` in Vercel Storage, pulled OIDC env vars into `.env.local`. API routes use `@aws-sdk/lib-dynamodb` server-side only.',
  },
  {
    step: '03',
    title: 'Single-table data model',
    body: 'PK/SK mappers in `api/lib/items.ts` — MOTHER#, APPOINTMENT#, TEAM#, MEDICATION#, MESSAGE#, DOCUMENT#, and LAB# under mother partitions.',
  },
  {
    step: '04',
    title: 'Shared fetch pattern',
    body: '`useApiListQuery` + `DataSourceBadge` on each page. Demo fallback when API is offline; switch to Live · DynamoDB when seed data exists.',
  },
];

export default function ArchitecturePage() {
  const [health, setHealth] = useState<{
    ok: boolean;
    region: string | null;
    table: string | null;
    hasAwsRole: boolean;
  } | null>(null);
  const [seeding, setSeeding] = useState(false);

  const loadHealth = useCallback(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { seeded } = await seedDatabase();
      const total = Object.values(seeded).reduce((a, b) => a + b, 0);
      toast.success(
        `Seeded ${total} records — ${seeded.users} users, ${seeded.mothers} mothers, ${seeded.appointments} appointments`,
      );
      loadHealth();
    } catch {
      toast.error('Seed failed — run `npm run dev` and connect DynamoDB in Vercel Storage');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16 space-y-12">
      {/* Hero */}
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
          Meds-inn is a React + Vite app deployed on Vercel with serverless API routes backed by
          Amazon DynamoDB. The browser never holds AWS credentials — all data flows through{' '}
          <code className="text-foreground text-sm">/api/*</code> handlers using Vercel OIDC.
        </p>
      </motion.div>

      {/* Stack summary */}
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

      {/* Build steps */}
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

      {/* Flow diagram */}
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

      {/* Security note */}
      <div className="flex gap-4 rounded-xl border border-primary/20 bg-secondary/50 p-5">
        <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground mb-1">Security boundary</p>
          <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
            DynamoDB credentials stay on the server. The React app calls{' '}
            <code className="text-foreground">fetch('/api/mothers')</code> — same origin in dev and prod.
            Never use <code className="text-foreground">VITE_</code> prefix for AWS secrets.
          </p>
        </div>
      </div>

      {/* Services */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-2">Services &amp; status</h2>
        <p className="text-sm text-muted-foreground mb-6">What is wired today vs planned for the hackathon roadmap.</p>
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

      {/* Live connection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Try it — DynamoDB connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Connect DynamoDB in Vercel Dashboard → Storage, run{' '}
            <code className="text-foreground">npm run vercel:env</code>, then{' '}
            <code className="text-foreground">npm run dev</code>. Seed demo data and open{' '}
            <Link to="/login" className="text-primary hover:underline">the dashboard</Link>
            {' '}→ Mothers to see the <strong>Live · DynamoDB</strong> badge.
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
            <Button size="sm" variant="outline" onClick={handleSeed} disabled={seeding}>
              {seeding ? 'Seeding…' : 'Seed demo data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground/60 pb-4">
        Production deployment adds HIPAA BAA execution, Cognito auth, audit logging, and compliance review.
      </p>
    </main>
  );
}
