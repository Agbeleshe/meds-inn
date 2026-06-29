import React, { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMedications } from '@/hooks/use-medications';
import { useMedicationDoses } from '@/hooks/use-medication-doses';
import { useMothers } from '@/hooks/use-mothers';
import { isAssignedToMother, canPrescribeMedicationForPatient } from '@/lib/assignments';
import { createMedication, updateMedication, recordMedicationDose } from '@/lib/api-client';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { AsyncButton } from '@/components/common/AsyncButton';
import { MedCardListSkeleton } from '@/components/common/TableSkeleton';
import { AdherenceBadge } from '@/components/common/Badges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import type { Medication, MedicationDose } from '@/types/clinical';
import {
  Pill, CheckCircle2, XCircle, Info, Plus, Shield, Clock, History,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const today = () => new Date().toISOString().slice(0, 10);

function historyRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 13);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

const STATUS_COLORS: Record<string, string> = {
  taken: 'text-[hsl(142_63%_30%)]',
  skipped: 'text-muted-foreground',
  missed: 'text-destructive',
  pending: 'text-amber-600',
};

export default function MedicationRemindersPage() {
  const { user } = useAuth();
  const isMother = user?.role === 'mother';
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    isMother ? (user?.motherId ?? '') : '',
  );
  const { mothers } = useMothers();

  const isAdmin = user?.role === 'admin';
  const isSpecialist = user?.role === 'nurse' || user?.role === 'doctor';

  const assignedMothers = useMemo(
    () => (user && !isMother ? mothers.filter((m) => isAssignedToMother(user, m)) : []),
    [mothers, user, isMother],
  );

  const prescribableMothers = useMemo(
    () => (isAdmin ? mothers : assignedMothers),
    [isAdmin, mothers, assignedMothers],
  );

  const motherNameById = useMemo(
    () => new Map(mothers.map((m) => [m.id, m.name])),
    [mothers],
  );

  const effectivePatientId = isMother
    ? user?.motherId
    : isAdmin
      ? (selectedPatientId || undefined)
      : (selectedPatientId || assignedMothers[0]?.id);

  const patientId = effectivePatientId || undefined;
  const canPrescribe = isAdmin || isSpecialist;
  const canAddMedication =
    canPrescribe &&
    (isAdmin ? mothers.length > 0 : assignedMothers.length > 0);
  const { medications, source, loading, refetch: refetchMeds } = useMedications(patientId);
  const { doses: todayDoses, loading: dosesLoading, refetch: refetchToday } = useMedicationDoses(patientId);
  const range = useMemo(() => historyRange(), []);
  const { doses: historyDoses, loading: historyLoading, refetch: refetchHistory } = useMedicationDoses(
    patientId,
    range,
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<(Medication & { canEdit?: boolean }) | null>(null);
  const [form, setForm] = useState({
    patientId: '',
    name: '',
    dosage: '',
    frequency: 'Once daily',
    route: 'Oral',
    instructions: '',
    startDate: today(),
    endDate: '',
    notes: '',
  });

  const takenToday = todayDoses.filter((d) => d.status === 'taken').length;
  const adherencePct = todayDoses.length
    ? Math.round((takenToday / todayDoses.length) * 100)
    : medications.length
      ? Math.round(medications.reduce((a, m) => a + m.adherence, 0) / medications.length)
      : 0;

  function openCreate() {
    setEditing(null);
    const defaultPatientId = patientId ?? prescribableMothers[0]?.id ?? '';
    setForm({
      patientId: defaultPatientId,
      name: '',
      dosage: '',
      frequency: 'Once daily',
      route: 'Oral',
      instructions: '',
      startDate: today(),
      endDate: '',
      notes: '',
    });
    setFormOpen(true);
  }

  function openEdit(med: Medication & { canEdit?: boolean }) {
    setEditing(med);
    setForm({
      patientId: med.patientId,
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      route: med.route,
      instructions: med.instructions,
      startDate: med.startDate,
      endDate: med.endDate,
      notes: med.notes,
    });
    setFormOpen(true);
  }

  async function saveMedication() {
    const targetPatientId = form.patientId || patientId;
    if (!targetPatientId || !form.name.trim() || !form.endDate) {
      toast.error('Select a mother and fill in name and end date');
      return;
    }

    const mother = mothers.find((m) => m.id === targetPatientId);
    if (user && isSpecialist && mother && !canPrescribeMedicationForPatient(user, mother)) {
      toast.error('You can only set reminders for mothers assigned to you');
      return;
    }

    const payload = { ...form, patientId: targetPatientId };
    try {
      if (editing) {
        await updateMedication({ ...payload, id: editing.id });
        toast.success('Medication updated');
      } else {
        await createMedication(payload);
        toast.success('Medication added');
      }
      setFormOpen(false);
      refetchMeds();
      refetchToday();
      refetchHistory();
    } catch {
      toast.error('Could not save medication');
    }
  }

  async function markDose(dose: MedicationDose, status: 'taken' | 'skipped') {
    try {
      await recordMedicationDose({
        doseId: dose.id,
        medicationId: dose.medicationId,
        patientId: dose.patientId,
        date: dose.date,
        scheduledTime: dose.scheduledTime,
        status,
      });
      toast.success(status === 'taken' ? 'Marked as taken' : 'Skipped — nurse notified');
      refetchToday();
      refetchMeds();
      refetchHistory();
    } catch {
      toast.error('Could not update dose');
    }
  }

  const showStaffEmpty = canPrescribe && !isMother && medications.length === 0 && !loading;
  const showHistory = Boolean(patientId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Medication Reminders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isMother
              ? 'Your prescribed medications — mark doses as taken each day'
              : user?.role === 'admin'
                ? 'Assign and manage prescriptions for any mother in your hospital'
                : 'Set reminders only for mothers assigned to you — you see prescriptions you created'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DataSourceBadge source={source} loading={loading} />
          {user?.role === 'admin' && (
            <Select value={selectedPatientId || '__all__'} onValueChange={(v) => setSelectedPatientId(v === '__all__' ? '' : v)}>
              <SelectTrigger className="h-9 w-[200px] text-xs"><SelectValue placeholder="Filter by mother" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All mothers</SelectItem>
                {mothers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {(user?.role === 'nurse' || user?.role === 'doctor') && assignedMothers.length === 0 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              No assigned mothers
            </Badge>
          )}
          {(user?.role === 'nurse' || user?.role === 'doctor') && assignedMothers.length > 0 && (
            <Select
              value={selectedPatientId || assignedMothers[0]?.id}
              onValueChange={setSelectedPatientId}
            >
              <SelectTrigger className="h-9 w-[200px] text-xs"><SelectValue placeholder="Select mother" /></SelectTrigger>
              <SelectContent>
                {assignedMothers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {canPrescribe && canAddMedication && (
            <AsyncButton size="sm" className="h-9 gap-1.5 text-xs" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5" /> Add medication
            </AsyncButton>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 bg-secondary px-4 py-3 rounded-lg border border-primary/20">
        <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          {isMother
            ? 'Prescriptions are set by your care team. Mark doses taken each day — you cannot edit prescriptions.'
            : isAdmin
              ? 'Hospital admins can assign medication reminders to any mother and edit any prescription.'
              : 'You can set reminders only for mothers assigned to you. You will only see prescriptions you created.'}
        </p>
      </div>

      {isMother ? (
        <MotherMedicationView
          medications={medications}
          todayDoses={todayDoses}
          loading={loading || dosesLoading}
          adherencePct={adherencePct}
          takenToday={takenToday}
          onMarkDose={markDose}
        />
      ) : (
        <StaffMedicationView
          medications={medications}
          historyDoses={historyDoses}
          loading={loading}
          historyLoading={historyLoading}
          showEmpty={showStaffEmpty}
          showHistory={showHistory}
          patientId={patientId}
          isAdmin={isAdmin}
          motherNameById={motherNameById}
          onEdit={openEdit}
          onAdd={openCreate}
        />
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit medication' : 'Add medication reminder'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {canPrescribe && !editing && (
              <div>
                <Label className="text-xs">Mother</Label>
                <Select
                  value={form.patientId}
                  onValueChange={(v) => setForm((f) => ({ ...f, patientId: v }))}
                >
                  <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select mother" /></SelectTrigger>
                  <SelectContent>
                    {prescribableMothers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs">Medication name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="h-9 text-sm mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Dosage</Label>
                <Input value={form.dosage} onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))} placeholder="400mcg" className="h-9 text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs">Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm((f) => ({ ...f, frequency: v }))}>
                  <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Once daily">Once daily</SelectItem>
                    <SelectItem value="Twice daily">Twice daily</SelectItem>
                    <SelectItem value="Three times daily">Three times daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Instructions</Label>
              <Textarea value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} rows={2} className="text-sm mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Start date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="h-9 text-sm mt-1" />
              </div>
              <div>
                <Label className="text-xs">End date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="h-9 text-sm mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="h-9 text-sm mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <AsyncButton loadingText="Saving…" onClick={saveMedication}>Save</AsyncButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MotherMedicationView({
  medications,
  todayDoses,
  loading,
  adherencePct,
  takenToday,
  onMarkDose,
}: {
  medications: Medication[];
  todayDoses: MedicationDose[];
  loading: boolean;
  adherencePct: number;
  takenToday: number;
  onMarkDose: (dose: MedicationDose, status: 'taken' | 'skipped') => Promise<void>;
}) {
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return <MedCardListSkeleton count={3} />;

  if (medications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No medications prescribed yet. Your care team will add reminders when needed.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-secondary/40">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Today&apos;s adherence</p>
              <p className="text-xs text-muted-foreground">{dateLabel}</p>
            </div>
            <span className="text-3xl font-bold text-primary">{adherencePct}%</span>
          </div>
          <Progress value={adherencePct} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {takenToday} of {todayDoses.length} scheduled doses taken today
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {todayDoses.map((dose) => {
          const isTaken = dose.status === 'taken';
          const isSkipped = dose.status === 'skipped';
          const med = medications.find((m) => m.id === dose.medicationId);

          return (
            <Card key={dose.id} className={cn(
              isTaken ? 'border-[hsl(142_63%_70%)] bg-[hsl(142_63%_97%)]' :
              isSkipped ? 'border-muted opacity-80' : 'border-border',
            )}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', isTaken ? 'bg-[hsl(142_63%_88%)]' : 'bg-secondary')}>
                    <Pill className={cn('w-5 h-5', isTaken ? 'text-[hsl(142_63%_30%)]' : 'text-primary')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold">{dose.medicationName ?? med?.name}</p>
                      <Badge variant="outline" className="text-xs">{dose.dosage ?? med?.dosage}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{dose.scheduledTime} · {med?.frequency}</p>
                    <p className="text-xs text-muted-foreground/70 italic mb-3">{med?.instructions}</p>
                    {isTaken ? (
                      <div className="flex items-center gap-1.5 text-xs text-[hsl(142_63%_30%)] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Taken
                      </div>
                    ) : isSkipped ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <XCircle className="w-3.5 h-3.5" /> Skipped — nurse notified
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <AsyncButton size="sm" className="h-8 text-xs flex-1 gap-1.5" loadingText="Saving…" onClick={() => onMarkDose(dose, 'taken')}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Taken
                        </AsyncButton>
                        <AsyncButton size="sm" variant="outline" className="h-8 text-xs flex-1 gap-1.5" loadingText="Saving…" onClick={() => onMarkDose(dose, 'skipped')}>
                          <XCircle className="w-3.5 h-3.5" /> Skip
                        </AsyncButton>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold">Your prescriptions</p>
        {medications.map((med) => (
          <Card key={med.id}>
            <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{med.name} · {med.dosage}</p>
                <p className="text-xs text-muted-foreground">Prescribed by {med.prescribedBy}</p>
              </div>
              <div className="text-right">
                <AdherenceBadge value={med.adherence} />
                <p className="text-xs text-muted-foreground mt-0.5">{med.missedDoses} missed doses</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StaffMedicationView({
  medications,
  historyDoses,
  loading,
  historyLoading,
  showEmpty,
  showHistory,
  patientId,
  isAdmin,
  motherNameById,
  onEdit,
  onAdd,
}: {
  medications: (Medication & { canEdit?: boolean })[];
  historyDoses: MedicationDose[];
  loading: boolean;
  historyLoading: boolean;
  showEmpty: boolean;
  showHistory: boolean;
  patientId?: string;
  isAdmin: boolean;
  motherNameById: Map<string, string>;
  onEdit: (med: Medication & { canEdit?: boolean }) => void;
  onAdd: () => void;
}) {
  if (loading) return <MedCardListSkeleton count={4} />;

  if (showEmpty) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            {patientId
              ? 'No medication reminders for this mother yet.'
              : isAdmin
                ? 'No prescriptions in the hospital yet — add one for any mother.'
                : 'You have not set any medication reminders yet. Add one for an assigned mother.'}
          </p>
          {(patientId || isAdmin) && (
            <Button size="sm" className="gap-1.5" onClick={onAdd}>
              <Plus className="w-3.5 h-3.5" /> Set reminder
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const historyByMed = medications.map((med) => ({
    med,
    doses: historyDoses.filter((d) => d.medicationId === med.id).slice(0, 14),
  }));

  return (
    <Tabs defaultValue="prescriptions">
      <TabsList className="h-9">
        <TabsTrigger value="prescriptions" className="text-xs">Prescriptions</TabsTrigger>
        <TabsTrigger value="history" className="text-xs gap-1" disabled={!showHistory}>
          <History className="w-3 h-3" /> Dose history
        </TabsTrigger>
      </TabsList>

      {!showHistory && (
        <p className="text-xs text-muted-foreground mt-3">
          Select a mother to view dose history. Admins can filter by patient above.
        </p>
      )}

      <TabsContent value="prescriptions" className="mt-4 space-y-4">
        {medications.map((med) => (
          <Card key={med.id}>
            <CardContent className="pt-5 pb-5">
              <div className="flex flex-col md:flex-row md:items-start gap-5">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Pill className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold">{med.name}</h3>
                    {isAdmin && !patientId && (
                      <Badge variant="secondary" className="text-xs">
                        {motherNameById.get(med.patientId) ?? med.patientId}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">{med.dosage}</Badge>
                    <Badge variant="outline" className="text-xs">{med.frequency}</Badge>
                    <Badge variant="outline" className="text-xs">{med.route}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{med.instructions}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs border-t border-border pt-3">
                    <div><p className="text-muted-foreground">Start</p><p className="font-medium mt-0.5">{med.startDate}</p></div>
                    <div><p className="text-muted-foreground">End</p><p className="font-medium mt-0.5">{med.endDate}</p></div>
                    <div><p className="text-muted-foreground">Prescribed by</p><p className="font-medium mt-0.5">{med.prescribedBy}</p></div>
                    <div><p className="text-muted-foreground">Last taken</p><p className="font-medium mt-0.5">{med.lastTaken ? med.lastTaken.replace('T', ' ').slice(0, 16) : '—'}</p></div>
                  </div>
                  {med.notes && (
                    <div className="flex items-start gap-1.5 mt-3 text-xs text-muted-foreground">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span className="italic">{med.notes}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <AdherenceBadge value={med.adherence} />
                  <p className="text-xs text-muted-foreground">adherence</p>
                  <Progress value={med.adherence} className="w-20 h-1.5" />
                  <p className="text-xs text-muted-foreground">{med.missedDoses} missed doses</p>
                  {med.canEdit && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onEdit(med)}>Edit</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="history" className="mt-4 space-y-4">
        {!showHistory ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Select a single mother to review dose history.
            </CardContent>
          </Card>
        ) : historyLoading ? (
          <MedCardListSkeleton count={2} />
        ) : (
          historyByMed.map(({ med, doses }) => (
            <Card key={med.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{med.name} — last 14 days</CardTitle>
              </CardHeader>
              <CardContent>
                {doses.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No dose records yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {doses.map((d) => (
                      <li key={d.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{d.date} · {d.scheduledTime}</span>
                        <span className={cn('font-medium capitalize', STATUS_COLORS[d.status] ?? '')}>{d.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-[hsl(142_63%_30%)]" /> taken</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-600" /> pending</span>
                  <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-destructive" /> missed / skipped</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
