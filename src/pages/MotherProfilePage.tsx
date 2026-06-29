import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MESSAGES } from '@/lib/demo-data';
import { useMother } from '@/hooks/use-mother';
import { useCareBrief } from '@/hooks/use-care-brief';
import { useAppointments } from '@/hooks/use-appointments';
import { useMedications } from '@/hooks/use-medications';
import { useDocuments } from '@/hooks/use-documents';
import { useMotherTimeline } from '@/hooks/use-mother-timeline';
import { useSymptoms } from '@/hooks/use-symptoms';
import { useLabs } from '@/hooks/use-labs';
import { useClinicalNotes } from '@/hooks/use-clinical-notes';
import { MotherProfileHeader } from '@/components/mother/MotherProfileHeader';
import { escalateCase } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useBabyProfile } from '@/hooks/use-baby';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { CareBriefPanel } from '@/components/clinical/CareBriefPanel';
import { RiskBadge, AdherenceBadge } from '@/components/common/Badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Calendar, FileText, AlertTriangle, Sparkles,
  Pill, TestTube, MessageSquare,
  Clock, CheckCircle2, AlertCircle, ChevronRight, Stethoscope,
  Baby, Syringe, Heart,
} from 'lucide-react';

const QUICK_ACTIONS = [
  { icon: Calendar, label: 'Schedule Appointment', color: 'text-primary', action: 'schedule' },
  { icon: AlertTriangle, label: 'Escalate Case', color: 'text-destructive', action: 'escalate' },
  { icon: Sparkles, label: 'Generate AI Brief', color: 'text-primary', action: 'ai' },
];

export default function MotherProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: patient, loading, source, canEdit, updateProfile, refetch } = useMother(id);
  const { profile: babyProfile } = useBabyProfile(id);
  const { brief, canEdit: canEditBrief, loading: briefLoading, busy: briefBusy, regenerate, markReviewed, saveClinicianNote } = useCareBrief(id);
  const { appointments: patientAppointments } = useAppointments(id);
  const { medications: patientMedications } = useMedications(id);
  const { documents: patientDocuments, loading: documentsLoading, downloadFile } = useDocuments(id);
  const { events: timelineEvents, loading: timelineLoading } = useMotherTimeline(id);
  const { symptoms, loading: symptomsLoading } = useSymptoms(id);
  const { labs, loading: labsLoading, createLabNote } = useLabs(id);
  const { notes: clinicalNotes, loading: notesLoading, createNote } = useClinicalNotes(id);
  const [tab, setTab] = useState('overview');
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [labNoteOpen, setLabNoteOpen] = useState(false);
  const [labNoteText, setLabNoteText] = useState('');
  const [clinicalNoteOpen, setClinicalNoteOpen] = useState(false);
  const [clinicalNoteText, setClinicalNoteText] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [escalateNote, setEscalateNote] = useState('');
  const [escalateSeverity, setEscalateSeverity] = useState<'urgent' | 'serious' | 'mild'>('serious');
  const [escalateTargets, setEscalateTargets] = useState<('doctor' | 'nurse' | 'admin')[]>([]);
  const [escalating, setEscalating] = useState(false);

  const isPostpartum =
    patient?.careStage === 'postpartum' || patient?.status === 'postpartum';

  const defaultEscalationTargets = (): ('doctor' | 'nurse' | 'admin')[] => {
    const role = user?.role;
    if (role === 'nurse') return ['doctor', 'admin'];
    if (role === 'doctor') return ['nurse', 'admin'];
    if (role === 'admin') return ['doctor', 'nurse'];
    return ['admin'];
  };

  const availableEscalationTargets = (): { key: 'doctor' | 'nurse' | 'admin'; label: string }[] => {
    const role = user?.role;
    if (role === 'nurse') {
      return [
        { key: 'doctor', label: patient?.doctor && patient.doctor !== 'To be assigned' ? patient.doctor : 'Assigned doctor' },
        { key: 'admin', label: 'Hospital admin' },
      ];
    }
    if (role === 'doctor') {
      return [
        { key: 'nurse', label: patient?.nurse && patient.nurse !== 'To be assigned' ? patient.nurse : 'Assigned nurse' },
        { key: 'admin', label: 'Hospital admin' },
      ];
    }
    if (role === 'admin') {
      return [
        { key: 'doctor', label: patient?.doctor && patient.doctor !== 'To be assigned' ? patient.doctor : 'Assigned doctor' },
        { key: 'nurse', label: patient?.nurse && patient.nurse !== 'To be assigned' ? patient.nurse : 'Assigned nurse' },
      ];
    }
    return [{ key: 'admin', label: 'Hospital admin' }];
  };

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
    if (action === 'schedule') {
      navigate(`/dashboard/appointments?patientId=${encodeURIComponent(p.id)}&book=1`);
      return;
    }
    if (action === 'escalate') {
      setEscalateTargets(defaultEscalationTargets());
      setEscalateOpen(true);
      return;
    }
    if (action === 'ai') {
      setTab('ai-brief');
      if (canEditBrief) {
        regenerate()
          .then(() => toast.success('AI care brief generated from latest patient data'))
          .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to generate brief'));
      } else {
        toast.info('Opening AI care brief');
      }
      return;
    }
  }

  async function submitLabNote() {
    if (!labNoteText.trim()) {
      toast.error('Please enter a lab note.');
      return;
    }
    setNoteSubmitting(true);
    try {
      await createLabNote({ notes: labNoteText.trim() });
      toast.success('Lab note added');
      setLabNoteOpen(false);
      setLabNoteText('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add lab note');
    } finally {
      setNoteSubmitting(false);
    }
  }

  async function submitClinicalNote() {
    if (!clinicalNoteText.trim()) {
      toast.error('Please enter a note.');
      return;
    }
    setNoteSubmitting(true);
    try {
      await createNote(clinicalNoteText.trim());
      toast.success('Clinical note added');
      setClinicalNoteOpen(false);
      setClinicalNoteText('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setNoteSubmitting(false);
    }
  }

  const canAddClinicalNotes = user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse';

  async function submitEscalation() {
    if (!escalateNote.trim()) {
      toast.error('Please add a note explaining the escalation.');
      return;
    }
    if (escalateTargets.length === 0) {
      toast.error('Select at least one person to notify.');
      return;
    }
    setEscalating(true);
    try {
      await escalateCase(p.id, {
        note: escalateNote.trim(),
        severity: escalateSeverity,
        targets: escalateTargets,
      });
      toast.success('Case escalated — your selected team members have been notified');
      setEscalateOpen(false);
      setEscalateNote('');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Escalation failed');
    } finally {
      setEscalating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DataSourceBadge source={source} loading={loading} />
      </div>
      {/* Header */}
      <MotherProfileHeader
        patient={patient}
        appointments={patientAppointments}
        canEdit={canEdit}
        onSave={updateProfile}
      />

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
            {isPostpartum ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Baby className="w-4 h-4" /> Baby profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {babyProfile?.babyName ? (
                    <>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Name</span><span className="font-medium">{babyProfile.babyName}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Birth date</span><span className="font-medium">{babyProfile.birthDate || '—'}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Birth weight</span><span className="font-medium">{babyProfile.birthWeight || '—'}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Feeding</span><span className="font-medium">{babyProfile.feedingMethod || '—'}</span></div>
                    </>
                  ) : (
                    <div className="rounded-lg border border-[hsl(38_92%_70%)] bg-[hsl(38_92%_97%)] px-3 py-3">
                      <p className="text-xs font-semibold text-[hsl(38_70%_30%)]">Baby information not yet provided</p>
                      <p className="text-xs text-muted-foreground mt-1">Ask the patient to complete their Baby Care profile, or prompt them from Messages.</p>
                      <Link to={`/dashboard/baby-care`} className="text-xs text-primary hover:underline mt-2 inline-block">Open Baby Care →</Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Pregnancy Overview</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gestational age</span><span className="font-medium">{patient.gestationalWeek} weeks</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Trimester</span><span className="font-medium">{patient.trimester}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">EDD</span><span className="font-medium">{patient.edd}</span></div>
                </CardContent>
              </Card>
            )}
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
              {timelineLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-4 pb-6 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-40 bg-muted rounded" />
                      <div className="h-3 w-full bg-muted rounded" />
                    </div>
                  </div>
                ))
              ) : timelineEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No timeline events yet.</p>
              ) : timelineEvents.map((e, i) => (
                <div key={e.id ?? i} className="flex gap-4 pb-6 last:pb-0">
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
                    {i < timelineEvents.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
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
            </CardHeader>
            <CardContent className="space-y-3">
              {symptomsLoading ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Loading symptom log…</p>
              ) : symptoms.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No logs yet — the patient can log symptoms from their Symptom Log page.</p>
              ) : (
                symptoms.map((s) => (
                  <div key={s.id} className="flex items-start gap-4 p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-xs text-muted-foreground">{s.date}</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{s.symptom}</p>
                      {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
                    </div>
                    <Badge variant="outline" className="text-xs ml-auto shrink-0">{s.severity}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lab results */}
        <TabsContent value="labs" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Lab Results & Notes</CardTitle>
              {canAddClinicalNotes && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setLabNoteOpen(true)}>
                  Add lab note
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-2">
              {labsLoading ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
              ) : labs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No lab results yet. Specialists can add notes here.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead>
                      <tr className="border-b border-border">
                        {['Test', 'Date', 'Result', 'Status', 'Notes', 'Ordered by'].map(h => (
                          <th key={h} className="text-left text-xs font-medium text-muted-foreground px-3 py-2 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {labs.map(l => (
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
                          <td className="px-3 py-3 text-xs text-muted-foreground max-w-[200px]">{l.notes}</td>
                          <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{l.orderedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="mt-4">
          {documentsLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading documents…</p>
          ) : patientDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No documents uploaded for this mother yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {patientDocuments.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={async () => {
                    const toastId = toast.loading(`Downloading ${d.name}…`);
                    try {
                      await downloadFile(d.id, d.name);
                      toast.success(`Downloaded ${d.name}`, { id: toastId });
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Download failed', { id: toastId });
                    }
                  }}
                  className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:shadow-[var(--shadow-hover)] transition-shadow cursor-pointer w-full text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.date} · {d.size}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{d.category}</Badge>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Clinical Notes</CardTitle>
              {canAddClinicalNotes && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setClinicalNoteOpen(true)}>
                  Add note
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {notesLoading ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Loading notes…</p>
              ) : clinicalNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No clinical notes yet. Specialists and admins can add visit notes here.</p>
              ) : (
                clinicalNotes.map((n) => (
                  <div
                    key={n.id}
                    className={`border-l-2 pl-4 ${
                      n.authorRole === 'doctor' ? 'border-primary' :
                      n.authorRole === 'nurse' ? 'border-[hsl(207_85%_45%)]' : 'border-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-foreground">{n.authorName}</span>
                      <Badge variant="outline" className="text-[10px] h-5">{n.authorRole}</Badge>
                      <span className="text-xs text-muted-foreground">{n.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground text-pretty leading-relaxed">{n.note}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Brief */}
        <TabsContent value="ai-brief" className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs text-muted-foreground">
              Brief compiled from care record, medications, appointments, checklist, and secure messaging.
            </p>
            <Link
              to={`/dashboard/care-briefs?motherId=${encodeURIComponent(patient.id)}`}
              className="text-xs text-primary hover:underline"
            >
              Open in AI Care Briefs →
            </Link>
          </div>
          <CareBriefPanel
            brief={brief}
            canEdit={canEditBrief}
            busy={briefBusy}
            loading={briefLoading}
            patientId={patient.id}
            riskLevel={patient.riskLevel}
            compact
            onRegenerate={canEditBrief ? () => regenerate().then(() => toast.success('Brief regenerated')) : undefined}
            onMarkReviewed={canEditBrief ? () => markReviewed().then(() => toast.success('Brief marked as reviewed')) : undefined}
            onSaveNote={canEditBrief ? saveClinicianNote : undefined}
          />

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

      <Dialog open={escalateOpen} onOpenChange={setEscalateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Escalate case — {p.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={escalateSeverity} onValueChange={(v) => setEscalateSeverity(v as 'urgent' | 'serious' | 'mild')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="serious">Serious</SelectItem>
                  <SelectItem value="mild">Mild</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notify</Label>
              <div className="space-y-2 rounded-lg border border-border p-3">
                {availableEscalationTargets().map((target) => (
                  <label key={target.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={escalateTargets.includes(target.key)}
                      onCheckedChange={(checked) => {
                        setEscalateTargets((prev) =>
                          checked
                            ? [...prev, target.key]
                            : prev.filter((t) => t !== target.key),
                        );
                      }}
                    />
                    <span>{target.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason for escalation</Label>
              <Textarea
                value={escalateNote}
                onChange={(e) => setEscalateNote(e.target.value)}
                placeholder="Describe the clinical concern and what support you need…"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={escalating} onClick={submitEscalation}>
              {escalating ? 'Sending…' : 'Send escalation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={labNoteOpen} onOpenChange={setLabNoteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add lab note — {p.name}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={labNoteText}
            onChange={(e) => setLabNoteText(e.target.value)}
            placeholder="Enter lab result or clinical note for the patient record…"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setLabNoteOpen(false)}>Cancel</Button>
            <Button disabled={noteSubmitting} onClick={submitLabNote}>
              {noteSubmitting ? 'Saving…' : 'Save lab note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={clinicalNoteOpen} onOpenChange={setClinicalNoteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add clinical note — {p.name}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={clinicalNoteText}
            onChange={(e) => setClinicalNoteText(e.target.value)}
            placeholder="Visit summary, follow-up instructions, observations…"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setClinicalNoteOpen(false)}>Cancel</Button>
            <Button disabled={noteSubmitting} onClick={submitClinicalNote}>
              {noteSubmitting ? 'Saving…' : 'Save note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
