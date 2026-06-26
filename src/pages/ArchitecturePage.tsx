import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Server, Database, Shield, Cloud, Bell, Video, Brain, Monitor,
  Globe, Layers, ArrowDown, ArrowRight, Users
} from 'lucide-react';

interface ServiceCard {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  description: string;
  details: string[];
  color: string;
}

const SERVICES: ServiceCard[] = [
  {
    name: 'v0',
    icon: Globe,
    category: 'UI Generation',
    description: 'Rapid frontend scaffold and component generation.',
    details: ['Component prototyping', 'Design system tokens', 'Tailwind integration'],
    color: 'bg-secondary border-primary/20',
  },
  {
    name: 'Vercel',
    icon: Cloud,
    category: 'Hosting & Deployment',
    description: 'Zero-config CI/CD and edge-optimised hosting for the Next.js frontend.',
    details: ['Edge network delivery', 'Preview deployments', 'GitHub integration'],
    color: 'bg-secondary border-primary/20',
  },
  {
    name: 'Amazon Cognito',
    icon: Shield,
    category: 'Authentication',
    description: 'Role-based user authentication for admins, nurses, doctors, and mothers.',
    details: ['JWT token management', 'Role-based access control', 'MFA support'],
    color: 'bg-[hsl(38_92%_96%)] border-[hsl(38_70%_60%)]',
  },
  {
    name: 'Amazon DynamoDB',
    icon: Database,
    category: 'Database',
    description: 'Serverless NoSQL database for patient records, appointments, and care data.',
    details: ['Sub-millisecond reads', 'Auto-scaling', 'Global tables'],
    color: 'bg-[hsl(207_85%_95%)] border-[hsl(207_85%_60%)]',
  },
  {
    name: 'Amazon S3',
    icon: Server,
    category: 'File Storage',
    description: 'Secure object storage for medical documents, scans, and uploaded reports.',
    details: ['Signed URL access', 'Server-side encryption', 'Lifecycle policies'],
    color: 'bg-[hsl(38_92%_96%)] border-[hsl(38_70%_60%)]',
  },
  {
    name: 'AWS Lambda',
    icon: Layers,
    category: 'Serverless Functions',
    description: 'Event-driven business logic for care plan processing and reminders.',
    details: ['Auto-scaling', 'Node.js 20 runtime', 'Event-driven triggers'],
    color: 'bg-[hsl(207_85%_95%)] border-[hsl(207_85%_60%)]',
  },
  {
    name: 'Amazon SNS / SES',
    icon: Bell,
    category: 'Notifications',
    description: 'Push and email notifications for medication reminders, appointments, and alerts.',
    details: ['SMS via SNS', 'Email templates via SES', 'Scheduled reminders'],
    color: 'bg-[hsl(142_63%_95%)] border-[hsl(142_63%_50%)]',
  },
  {
    name: 'Amazon Chime SDK',
    icon: Video,
    category: 'Video Consultations',
    description: 'HIPAA-eligible real-time video for nurse and doctor consultations.',
    details: ['WebRTC-based', 'Session recording', 'Up to 16 participants'],
    color: 'bg-[hsl(142_63%_95%)] border-[hsl(142_63%_50%)]',
  },
  {
    name: 'Amazon Bedrock',
    icon: Brain,
    category: 'AI / LLM',
    description: 'AI care brief generation using foundation models, grounded in patient records.',
    details: ['Claude / Titan models', 'RAG over patient history', 'Clinician review gates'],
    color: 'bg-secondary border-primary/20',
  },
  {
    name: 'Amazon CloudWatch',
    icon: Monitor,
    category: 'Monitoring',
    description: 'Observability, alerting, and audit logging across the entire platform.',
    details: ['Real-time dashboards', 'Alarm thresholds', 'Log aggregation'],
    color: 'bg-[hsl(207_85%_95%)] border-[hsl(207_85%_60%)]',
  },
];

const FLOW_ROWS = [
  {
    label: 'Clients',
    nodes: ['Mother (App)', 'Nurse (Dashboard)', 'Doctor (Dashboard)', 'Admin (Dashboard)'],
    icon: Users,
  },
  {
    label: 'Frontend',
    nodes: ['Next.js App on Vercel'],
    icon: Globe,
    span: true,
  },
  {
    label: 'API Layer',
    nodes: ['REST / GraphQL · AWS API Gateway · Lambda Handlers'],
    icon: Layers,
    span: true,
  },
  {
    label: 'Services',
    nodes: ['Cognito (Auth)', 'DynamoDB (Data)', 'S3 (Files)', 'Bedrock (AI)', 'Chime (Video)', 'SNS/SES (Notify)', 'CloudWatch (Observe)'],
    icon: Server,
  },
];

export default function ArchitecturePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div data-tour="architecture-header">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-foreground">Architecture</h1>
          <Badge variant="outline" className="text-xs font-normal">Hackathon submission</Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Meds-inn is built on Vercel and AWS — a serverless, scalable stack designed for clinical reliability and HIPAA-eligible deployment.
          Every care touchpoint is backed by purpose-built services.
        </p>
      </div>

      {/* Architecture flow diagram */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">System Architecture Flow</CardTitle>
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

      {/* Service cards grid */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Services &amp; Responsibilities</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map(svc => {
            const Icon = svc.icon;
            return (
              <div
                key={svc.name}
                className={`rounded-xl border p-5 flex flex-col h-full ${svc.color}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{svc.name}</p>
                    <Badge variant="outline" className="text-xs mt-0.5 font-normal">{svc.category}</Badge>
                  </div>
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
      </div>

      {/* Design principles */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            title: 'HIPAA-eligible stack',
            body: 'AWS Cognito, DynamoDB, S3, and Chime SDK all offer HIPAA Business Associate Agreements. Data at rest and in transit is encrypted.',
          },
          {
            title: 'Serverless by default',
            body: 'Lambda and DynamoDB auto-scale with patient load. No infrastructure to provision — operational costs stay proportional to usage.',
          },
          {
            title: 'AI with a clinician gate',
            body: 'Bedrock powers care brief generation. Every brief requires clinician review before any action is taken. AI assists; clinicians decide.',
          },
        ].map(p => (
          <div key={p.title} className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm font-semibold text-foreground mb-2">{p.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{p.body}</p>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground/60 pb-4">
        Architecture designed for hackathon demonstration. Full production deployment would include additional security hardening, HIPAA BAA execution, audit logging, and compliance review.
      </p>
    </div>
  );
}
