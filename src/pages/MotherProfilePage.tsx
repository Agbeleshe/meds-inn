import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { LAB_RESULTS, DOCUMENTS, MESSAGES } from '@/lib/demo-data';
import { useMother } from '@/hooks/use-mother';
import { useAppointments } from '@/hooks/use-appointments';
import { useMedications } from '@/hooks/use-medications';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { ACTIVE_HOSPITAL } from '@/lib/hospitals';
import { RiskBadge, AdherenceBadge } from '@/components/common/Badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Calendar, Video, Bell, FileText, AlertTriangle, Sparkles,
  Phone, Mail, Heart, Pill, TestTube, Upload, MessageSquare,
  Clock, CheckCircle2, AlertCircle, ChevronRight, Stethoscope,
  Baby, User, Syringe
} from 'lucide-react';

const QUICK_ACTIONS = [
  { icon: Calendar, label: 'Schedule Appointment', color: 'text-primary', action: 'schedule' },
  { icon: Video, label: 'Start Video Consultation', color: 'text-[hsl(207_85%_45%)]', action: 'video' },
  { icon: Bell, label: 'Send Reminder', color: 'text-accent', action: 'reminder' },
  { icon: MessageSquare, label: 'Add Nurse Note', color: 'text-[hsl(142_63%_35%)]', action: 'note' },
  { icon: Upload, label: 'Upload Report', color: 'text-muted-foreground', action: 'upload' },
  { icon: AlertTriangle, label: 'Escalate Case', color: 'text-destructive', action: 'escalate' },
  { icon: Sparkles, label: 'Generate AI Brief', color: 'text-primary', action: 'ai' },
];

const TIMELINE_EVENTS = [
  { date: '2026-06-20', type: 'appointment', title: '22-Week Antenatal Visit', note: 'Routine check. Fundal height 22cm. FHR 148bpm. Blood pressure 118/76.', by: 'Dr. Tolu Adebayo' },
  { date: '2026-06-18', type: 'nurse-note', title: 'Nurse Follow-up Call', note: 'Amina reported mild fatigue and occasional dizziness. Advised to increase fluid intake and rest between tasks. Scheduled monitoring check.', by: 'Nurse Esther Okonkwo' },
  { date: '2026-06-14', type: 'lab', title: 'Lab Results Received', note: 'FBC: Hb 10.8 g/dL (slightly below range). Iron supplementation continued.', by: 'Lab Services' },
  { date: '2026-06-01', type: 'scan', title: '20-Week Anomaly Scan', note: 'Anatomy scan complete. No anomalies detected. Baby in cephalic position. Estimated weight 523g.', by: 'Imaging Suite, Elara WSC' },
  { date: '2026-04-10', type: 'appointment', title: '12-Week Dating Scan & Bloods', note: 'NT measurement 1.2mm. Booking bloods all within normal range. Hepatitis B negative.', by: 'Dr. Tolu Adebayo' },
];

const NURSE_NOTES = [
  { date: '2026-06-18', nurse: 'Nurse Esther Okonkwo', note: 'Follow-up call completed. Amina reports fatigue and occasional dizziness. Advised hydration and rest. Will monitor via next appointment. Iron compliance confirmed — taking with meals.' },
  { date: '2026-05-20', nurse: 'Nurse Esther Okonkwo', note: 'Monthly check-in completed. Amina feeling well overall. Baby movements confirmed from last week. Discussed birth plan preferences — prefers natural birth, partner to be present.' },
];

const DOCTOR_NOTES = [
  { date: '2026-06-20', doctor: 'Dr. Tolu Adebayo', note: 'Routine 22-week review. Fundal height appropriate. Blood pressure within normal range. FHR strong. Haemoglobin slightly below range — iron dose maintained. Advised rest and monitoring of dizziness. Follow-up in 4 weeks.' },
];

const SYMPTOM_LOG = [
  { date: '2026-06-22', symptom: 'Fatigue', severity: 'mild', notes: 'Persistent tiredness in the afternoons.' },
  { date: '2026-06-20', symptom: 'Occasional dizziness', severity: 'mild', notes: 'Mainly when standing up quickly.' },
  { date: '2026-06-10', symptom: 'Back pain', severity: 'mild', notes: 'Lower back discomfort when sitting for long periods.' },
];

export default function MotherProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: patient, loading, source } = useMother(id);
  const { appointments: patientAppointments } = useAppointments(id);
  const { medications: patientMedications } = useMedications(id);
  const [tab, setTab] = useState('overview');

  if (loading && !patient) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <p>Mother profile not found.</p>
      </div>
    );
  }

  const p = patient;

  function handleQuickAction(action: string) {
    const messages: Record<string, string> = {
      schedule: 'Opening appointment scheduler…',
      video: 'Initiating video consultation…',
      reminder: `Reminder sent to ${p.name}.`,
      note: 'Nurse note panel opened.',
      upload: 'Upload dialog opened.',
      escalate: 'Case escalation form opened.',
      ai: 'Generating AI care brief…',
    };
    toast.success(messages[action] ?? 'Action triggered');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DataSourceBadge source={source} loading={loading} />
      </div>
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <Avatar className="w-16 h-16 shrink-0">
            <AvatarFallback className="text-xl font-bold bg-secondary text-primary">{patient.initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-foreground">{patient.name}</h1>
              <RiskBadge level={patient.riskLevel} />
              <Badge variant="outline" className="text-xs">ID: {patient.id}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm mt-3">
              {[
                { label: 'Age', value: `${patient.age} years` },
                { label: 'Hospital', value: ACTIVE_HOSPITAL.name },
                { label: 'Pregnancy Stage', value: `${patient.gestationalWeek} weeks — ${patient.trimester} Trimester` },
                { label: 'EDD', value: patient.edd },
                { label: 'Blood Group', value: patient.bloodGroup },
                { label: 'Allergies', value: patient.allergies },
                { label: 'Last Visit', value: patient.lastCheckIn },
                { label: 'Next Appointment', value: patient.nextAppointment },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Nurse:</span>
                <span className="text-xs font-medium text-foreground">{patient.nurse}</span>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Doctor:</span>
                <span className="text-xs font-medium text-foreground">{patient.doctor}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">{patient.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Emergency:</span>
                <span className="text-xs font-medium text-foreground">{patient.emergencyContact}</span>
              </div>
            </div>
          </div>
          {/* Adherence */}
          <div className="flex flex-col items-center gap-1 bg-secondary rounded-xl px-6 py-4 shrink-0">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Adherence</span>
            <span className="text-3xl font-bold text-primary">{patient.adherence}%</span>
            <Progress value={patient.adherence} className="w-24 h-1.5 mt-1" />
            <span className="text-xs text-muted-foreground">Medication</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
        {QUICK_ACTIONS.map(a => {
          const Icon = a.icon;
          return (
            <button
              key={a.action}
              onClick={() => handleQuickAction(a.action)}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-card border border-border hover:border-primary/30 hover:shadow-[var(--shadow-hover)] transition-all text-center group"
            >
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center group-hover:bg-secondary transition-colors">
                <Icon className={`w-4 h-4 ${a.color}`} />
              </div>
              <span className="text-xs text-muted-foreground leading-tight">{a.label}</span>
            </button>
          );
        })}
      </div>

      {/* Current concerns */}
      {(patient.concerns ?? []).length > 0 && (
        <div className="flex items-start gap-3 bg-[hsl(38_92%_97%)] border border-[hsl(38_92%_80%)] rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 text-[hsl(38_70%_40%)] mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-[hsl(38_70%_30%)]">Current concerns</p>
            <p className="text-xs text-[hsl(38_70%_35%)] mt-0.5">{(patient.concerns ?? []).join(' · ')}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-9 flex-wrap">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'timeline', label: 'Care Timeline' },
            { key: 'medications', label: 'Medications' },
            { key: 'symptoms', label: 'Symptom Log' },
            { key: 'labs', label: 'Lab Results' },
            { key: 'documents', label: 'Documents' },
            { key: 'notes', label: 'Notes' },
            { key: 'ai-brief', label: 'AI Brief' },
          ].map(t => (
            <TabsTrigger key={t.key} value={t.key} className="text-xs px-3">{t.label}</TabsTrigger>
          ))}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Pregnancy Overview</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gestational age</span><span className="font-medium">{patient.gestationalWeek} weeks</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Trimester</span><span className="font-medium">{patient.trimester}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">EDD</span><span className="font-medium">{patient.edd}</span></div>
                <Separator />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  At 24 weeks, baby is approximately the size of a corn cob. Fetal movements have begun and should be felt regularly. 
                  Glucose tolerance test is recommended between 24–28 weeks.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Upcoming Appointments</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {patientAppointments.filter(a => a.patientId === patient.id).slice(0, 3).map(a => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{a.type}</p>
                      <p className="text-xs text-muted-foreground">{a.date} · {a.time}</p>
                      <p className="text-xs text-muted-foreground">{a.clinician}</p>
                    </div>
                    <Badge variant="outline" className="text-xs ml-auto shrink-0">{a.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-0">
              {TIMELINE_EVENTS.map((e, i) => (
                <div key={i} className="flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      e.type === 'appointment' ? 'bg-secondary' :
                      e.type === 'nurse-note' ? 'bg-[hsl(207_85%_92%)]' :
                      e.type === 'lab' ? 'bg-[hsl(38_53%_92%)]' : 'bg-muted'
                    }`}>
                      {e.type === 'appointment' ? <Calendar className="w-3.5 h-3.5 text-primary" /> :
                       e.type === 'nurse-note' ? <MessageSquare className="w-3.5 h-3.5 text-[hsl(207_85%_40%)]" /> :
                       e.type === 'lab' ? <TestTube className="w-3.5 h-3.5 text-accent" /> :
                       <FileText className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                    {i < TIMELINE_EVENTS.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
                  </div>
                  <div className="pb-2 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-semibold text-foreground">{e.title}</p>
                      <span className="text-xs text-muted-foreground">{e.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-pretty leading-relaxed">{e.note}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">— {e.by}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medications */}
        <TabsContent value="medications" className="mt-4 space-y-3">
          {patientMedications.filter(m => m.patientId === patient.id).map(m => (
            <Card key={m.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground">{m.name}</h3>
                      <Badge variant="outline" className="text-xs">{m.dosage}</Badge>
                      <Badge variant="outline" className="text-xs">{m.frequency}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{m.instructions}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div><span className="text-muted-foreground">Route: </span><span className="font-medium">{m.route}</span></div>
                      <div><span className="text-muted-foreground">Prescribed by: </span><span className="font-medium">{m.prescribedBy}</span></div>
                      <div><span className="text-muted-foreground">Start: </span><span className="font-medium">{m.startDate}</span></div>
                      <div><span className="text-muted-foreground">Last taken: </span><span className="font-medium">{m.lastTaken.split('T')[0]}</span></div>
                    </div>
                    {m.notes && <p className="text-xs text-muted-foreground/70 italic mt-2">{m.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <AdherenceBadge value={m.adherence} />
                    <span className="text-xs text-muted-foreground">{m.missedDoses} missed doses</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Symptom log */}
        <TabsContent value="symptoms" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Symptom Log</CardTitle>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success('Symptom logged')}>Add symptom</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {SYMPTOM_LOG.map((s, i) => (
                <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.date}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{s.symptom}</p>
                    <p className="text-xs text-muted-foreground">{s.notes}</p>
                  </div>
                  <Badge variant="outline" className="text-xs ml-auto shrink-0">{s.severity}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lab results */}
        <TabsContent value="labs" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-border">
                      {['Test', 'Date', 'Result', 'Status', 'Ordered by'].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-muted-foreground px-3 py-2 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {LAB_RESULTS.map(l => (
                      <tr key={l.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-3 text-sm font-medium text-foreground whitespace-nowrap">{l.test}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{l.date}</td>
                        <td className="px-3 py-3 text-xs text-foreground whitespace-nowrap">{l.result}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            l.flag === 'normal' ? 'bg-[hsl(142_63%_90%)] text-[hsl(142_63%_25%)]' :
                            l.flag === 'mild-concern' ? 'bg-[hsl(38_92%_90%)] text-[hsl(38_70%_28%)]' :
                            'bg-[hsl(0_72%_92%)] text-[hsl(0_72%_36%)]'
                          }`}>
                            {l.flag === 'normal' ? 'Normal' : l.flag === 'mild-concern' ? 'Review' : 'Flagged'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{l.orderedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="mt-4">
          <div className="grid md:grid-cols-2 gap-3">
            {DOCUMENTS.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:shadow-[var(--shadow-hover)] transition-shadow cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.date} · {d.size}</p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">{d.category}</Badge>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Nurse Notes</CardTitle>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success('Note added')}>Add note</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {NURSE_NOTES.map((n, i) => (
                <div key={i} className="border-l-2 border-[hsl(207_85%_45%)] pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground">{n.nurse}</span>
                    <span className="text-xs text-muted-foreground">{n.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-pretty leading-relaxed">{n.note}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Doctor Notes</CardTitle>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success('Note added')}>Add note</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {DOCTOR_NOTES.map((n, i) => (
                <div key={i} className="border-l-2 border-primary pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground">{n.doctor}</span>
                    <span className="text-xs text-muted-foreground">{n.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-pretty leading-relaxed">{n.note}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Brief */}
        <TabsContent value="ai-brief" className="mt-4">
          <Card className="border-primary/20 bg-secondary/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-semibold text-primary">AI Care Brief</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs text-[hsl(38_70%_35%)] border-[hsl(38_70%_50%)]">Awaiting review</Badge>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success('Regenerating care brief…')}>Regenerate</Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Generated June 25, 2026 · 07:00 AM — for clinical review only</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-card rounded-lg p-4 border border-primary/10">
                <p className="text-sm text-foreground text-pretty leading-relaxed">
                  Amina Bello is 24 weeks pregnant with 89% medication adherence. She missed one appointment in the last 30 days and recently reported fatigue and occasional dizziness. Her haemoglobin at the June 20 visit was slightly below range at 10.8 g/dL. Iron supplementation is ongoing.
                </p>
                <p className="text-sm text-foreground text-pretty leading-relaxed mt-3">
                  Suggested next steps: nurse follow-up within 48 hours to assess dizziness and fatigue. Glucose tolerance test to be scheduled before the 28-week visit. Review iron adherence and spacing at next appointment. No urgent escalation indicated at this time.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { label: 'Risk Cues', items: ['Fatigue reported x2 weeks', 'Occasional dizziness', 'Hb slightly below range'] },
                  { label: 'Adherence Summary', items: ['Medication: 89%', 'Appointments: 1 missed (30 days)', 'Last check-in: June 20'] },
                  { label: 'Suggested Follow-ups', items: ['Nurse call within 48 hours', 'GTT by end of July', 'Next appointment: June 28'] },
                ].map(section => (
                  <div key={section.label} className="bg-card rounded-lg p-3 border border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{section.label}</p>
                    <ul className="space-y-1">
                      {section.items.map(item => (
                        <li key={item} className="flex items-start gap-1.5 text-xs text-foreground">
                          <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Button size="sm" className="h-8 text-xs gap-1" onClick={() => toast.success('Brief marked as reviewed')}><CheckCircle2 className="w-3.5 h-3.5" />Mark as reviewed</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast.success('Note added to brief')}>Add clinician note</Button>
                <p className="text-xs text-muted-foreground ml-auto">AI assists clinicians — does not diagnose or prescribe.</p>
              </div>
            </CardContent>
          </Card>

          {/* Baby transition */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Baby className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Baby Care Transition Plan</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground text-pretty leading-relaxed mb-4">
                This plan will activate after delivery. It captures the expected handover from maternal to infant care and ensures continuity for both Amina and Baby Bello in the first year.
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { icon: Heart, label: '6-Week Postpartum Check', desc: 'Booked with Dr. Ifeoma Nnaji. Includes maternal recovery and baby wellness.' },
                  { icon: Syringe, label: 'Vaccination Schedule', desc: 'First immunisations at 8 weeks. Schedule ready for activation post-delivery.' },
                  { icon: Baby, label: 'Paediatric Assignment', desc: 'Baby Bello assigned to Dr. Ifeoma Nnaji for first-year follow-up.' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon className="w-4 h-4 text-primary" />
                        <p className="text-xs font-semibold text-foreground">{item.label}</p>
                      </div>
                      <p className="text-xs text-muted-foreground text-pretty leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
