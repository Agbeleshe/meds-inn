import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCarePlanList } from '@/hooks/use-care-plan-list';
import { useCarePlan } from '@/hooks/use-care-plan';
import { useMothers } from '@/hooks/use-mothers';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { AsyncButton } from '@/components/common/AsyncButton';
import { SavingIndicator } from '@/components/common/SavingIndicator';
import { MedCardListSkeleton } from '@/components/common/TableSkeleton';
import { carePlanIcon } from '@/lib/care-plan-icons';
import { DEMO_USERS } from '@/lib/demo-users';
import { assignMotherStaff } from '@/lib/api-client';
import { isAssignedToMother } from '@/lib/assignments';
import type {
  CarePlanSection,
  CareEducationItem,
  ChecklistDaySummary,
  Mother,
} from '@/types/clinical';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  CheckCircle2, Clock, Edit2, AlertTriangle, Save, X, ArrowLeft,
  UserPlus, Lock, ChevronRight, Plus, Trash2, CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STAFF_NURSES = DEMO_USERS.filter((u) => u.role === 'nurse');
const STAFF_DOCTORS = DEMO_USERS.filter((u) => u.role === 'doctor');

type ListTab = 'all' | 'assigned' | 'unassigned' | 'assign';

export default function CarePlansPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('motherId');
  const createMode = searchParams.get('create') === '1';
  const [listTab, setListTab] = useState<ListTab>(user?.role === 'admin' ? 'all' : 'assigned');
  const [createOpen, setCreateOpen] = useState(false);
  const [pickMotherId, setPickMotherId] = useState('');
  const listQueryTab = listTab === 'assign' ? 'all' : listTab;
  const { items, source, loading, refetch: refetchList } = useCarePlanList(listQueryTab);
  const { mothers } = useMothers();

  const assignableMothers = React.useMemo(() => {
    if (!user) return [] as Mother[];
    if (user.role === 'admin') return mothers as Mother[];
    return (mothers as Mother[]).filter((m) =>
      isAssignedToMother(
        { id: user.id, role: user.role, name: user.name ?? '' },
        m,
      ),
    );
  }, [mothers, user]);

  if (selectedId) {
    return (
      <CarePlanDetail
        motherId={selectedId}
        createMode={createMode}
        onBack={() => setSearchParams({})}
        onSaved={() => refetchList()}
      />
    );
  }

  function startCreateCarePlan() {
    if (assignableMothers.length === 0) {
      toast.error('No assigned mothers available. Ask admin to assign patients to you first.');
      return;
    }
    setPickMotherId(assignableMothers[0]?.id ?? '');
    setCreateOpen(true);
  }

  function confirmCreateCarePlan() {
    if (!pickMotherId) {
      toast.error('Select a mother to assign the care plan to.');
      return;
    }
    setCreateOpen(false);
    setSearchParams({ motherId: pickMotherId, create: '1' });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">Care Plans</h1>
            <DataSourceBadge source={source} loading={loading} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create and assign daily checklists for your assigned mothers.
          </p>
        </div>
        {user?.role !== 'mother' && (
          <Button size="sm" className="h-9 gap-1.5 text-xs shrink-0" onClick={startCreateCarePlan}>
            <Plus className="w-3.5 h-3.5" /> Create new care plan
          </Button>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create new care plan</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Choose an assigned mother, then build her daily checklist and duration.
          </p>
          <div className="space-y-2">
            <label htmlFor="pick-mother" className="text-xs font-medium">Mother</label>
            <Select value={pickMotherId} onValueChange={setPickMotherId}>
              <SelectTrigger id="pick-mother" className="h-9 text-sm">
                <SelectValue placeholder="Select mother" />
              </SelectTrigger>
              <SelectContent>
                {assignableMothers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} · {m.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={confirmCreateCarePlan}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs value={listTab} onValueChange={(v) => setListTab(v as ListTab)}>
        <TabsList className="h-9 flex-wrap">
          {user?.role === 'admin' && (
            <TabsTrigger value="all" className="text-xs">All mothers</TabsTrigger>
          )}
          <TabsTrigger value="assigned" className="text-xs">Assigned to me</TabsTrigger>
          {user?.role === 'admin' && (
            <>
              <TabsTrigger value="unassigned" className="text-xs">Unassigned</TabsTrigger>
              <TabsTrigger value="assign" className="text-xs gap-1">
                <UserPlus className="w-3 h-3" /> Assign staff
              </TabsTrigger>
            </>
          )}
        </TabsList>
      </Tabs>

      {listTab === 'assign' && user?.role === 'admin' ? (
        <AdminAssignPanel mothers={mothers} onAssigned={refetchList} />
      ) : loading ? (
        <MedCardListSkeleton count={6} />
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No mothers match this view.
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((m) => {
            const pct = m.checklistAdherence ?? (
              m.checklistTotal > 0
                ? Math.round((m.checklistDone / m.checklistTotal) * 100)
                : 0
            );
            return (
              <Card
                key={m.motherId}
                className="hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setSearchParams({ motherId: m.motherId })}
              >
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{m.motherName}</p>
                      <p className="text-xs text-muted-foreground">{m.motherId} · Wk {m.gestationalWeek}</p>
                    </div>
                    {m.canEdit ? (
                      <Badge variant="outline" className="text-xs text-primary border-primary/30">Can edit</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs gap-1"><Lock className="w-3 h-3" /> View only</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 mb-3">
                    <p>Nurse: {m.nurse}</p>
                    <p>Doctor: {m.doctor}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {m.hasDailyChecklist ? `${pct}% adherence` : `${pct}% today`}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminAssignPanel({
  mothers,
  onAssigned,
}: {
  mothers: { id: string; name: string; nurse: string; doctor: string; assignedNurseUserId?: string | null; assignedDoctorUserId?: string | null }[];
  onAssigned: () => void;
}) {
  const [draft, setDraft] = useState<Record<string, { nurseId: string; doctorId: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  async function saveAssignment(motherId: string, name: string) {
    const d = draft[motherId];
    if (!d) return;
    setSaving(motherId);
    try {
      const nurse = STAFF_NURSES.find((n) => n.id === d.nurseId);
      const doctor = STAFF_DOCTORS.find((doc) => doc.id === d.doctorId);
      await assignMotherStaff(motherId, {
        assignedNurseUserId: d.nurseId && d.nurseId !== '__none__' ? d.nurseId : null,
        assignedDoctorUserId: d.doctorId && d.doctorId !== '__none__' ? d.doctorId : null,
        nurse: nurse?.name ?? 'To be assigned',
        doctor: doctor?.name ?? 'To be assigned',
      });
      toast.success(`Assignment saved for ${name}. Staff will be notified.`);
      onAssigned();
    } catch {
      toast.error('Could not save assignment');
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Assign nurse & doctor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mothers.map((m) => (
          <div key={m.id} className="grid md:grid-cols-4 gap-3 items-end border-b border-border pb-4 last:border-0 last:pb-0">
            <div>
              <p className="text-sm font-medium">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.id}</p>
            </div>
            <Select
              value={draft[m.id]?.nurseId ?? m.assignedNurseUserId ?? ''}
              onValueChange={(v) => setDraft((p) => ({ ...p, [m.id]: { ...p[m.id], nurseId: v, doctorId: p[m.id]?.doctorId ?? m.assignedDoctorUserId ?? '' } }))}
            >
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select nurse" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unassigned</SelectItem>
                {STAFF_NURSES.map((n) => (
                  <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={draft[m.id]?.doctorId ?? m.assignedDoctorUserId ?? ''}
              onValueChange={(v) => setDraft((p) => ({ ...p, [m.id]: { nurseId: p[m.id]?.nurseId ?? m.assignedNurseUserId ?? '', doctorId: v } }))}
            >
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select doctor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unassigned</SelectItem>
                {STAFF_DOCTORS.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AsyncButton
              size="sm"
              className="h-9 text-xs"
              loading={saving === m.id}
              loadingText="Saving…"
              onClick={() => saveAssignment(m.id, m.name)}
            >
              Save & notify
            </AsyncButton>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CarePlanDetail({
  motherId,
  createMode,
  onBack,
  onSaved,
}: {
  motherId: string;
  createMode?: boolean;
  onBack: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const { plan, canEdit, source, loading, saving, persist } = useCarePlan(motherId);
  const [editing, setEditing] = useState<string | null>(null);
  const [localSections, setLocalSections] = useState<CarePlanSection[] | null>(null);
  const [builderItems, setBuilderItems] = useState<{ id?: string; text: string }[]>([{ text: '' }]);
  const [durationDays, setDurationDays] = useState('7');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    setLocalSections(null);
  }, [motherId, plan?.updatedAt]);

  useEffect(() => {
    if (plan?.dailyChecklist?.items?.length) {
      setBuilderItems(plan.dailyChecklist.items.map((i) => ({ id: i.id, text: i.text })));
      setDurationDays(String(plan.dailyChecklist.durationDays));
      setStartDate(plan.dailyChecklist.startDate);
    } else {
      setBuilderItems([{ text: '' }]);
      setDurationDays('7');
      setStartDate(new Date().toISOString().slice(0, 10));
    }
  }, [plan?.dailyChecklist, motherId]);

  const sections = localSections ?? plan?.sections ?? [];
  const education = plan?.education ?? [];
  const adherence = plan?.checklistAdherence;
  const dailyAssignment = plan?.dailyChecklist;

  async function toggleItem(sectionId: string, itemIdx: number) {
    if (!canEdit) return;
    const next = sections.map((s) =>
      s.id === sectionId
        ? { ...s, items: s.items.map((item, i) => (i === itemIdx ? { ...item, done: !item.done } : item)) }
        : s,
    );
    setLocalSections(next);
    try {
      await persist({ sections: next, education });
      toast.success('Care plan updated');
      onSaved();
    } catch {
      toast.error('Could not save');
    }
  }

  async function assignDailyChecklist() {
    if (!canEdit) return;
    const items = builderItems.filter((i) => i.text.trim());
    if (items.length === 0) {
      toast.error('Add at least one checklist item.');
      return;
    }
    const days = Math.max(1, Number(durationDays) || 7);
    setAssigning(true);
    try {
      await persist({
        dailyChecklist: {
          items,
          durationDays: days,
          startDate,
        },
      });
      toast.success(`Care plan assigned for ${days} days — mother has been notified`);
      onSaved();
    } catch {
      toast.error('Could not assign checklist');
    } finally {
      setAssigning(false);
    }
  }

  function addBuilderRow() {
    setBuilderItems((prev) => [...prev, { text: '' }]);
  }

  function removeBuilderRow(index: number) {
    setBuilderItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateBuilderRow(index: number, text: string) {
    setBuilderItems((prev) => prev.map((row, i) => (i === index ? { ...row, text } : row)));
  }

  const totalItems = sections.flatMap((s) => s.items).length;
  const completedItems = sections.flatMap((s) => s.items).filter((i) => i.done).length;
  const overallPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Back to list
        </Button>
        <DataSourceBadge source={source} loading={loading} />
        {!canEdit && (
          <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
            <Lock className="w-3 h-3" /> You haven&apos;t been assigned to this mother — view only
          </Badge>
        )}
      </div>

      {!canEdit && !loading && (
        <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm text-muted-foreground">
          Ask your hospital admin to assign you as this mother&apos;s nurse or doctor before you can edit her care plan.
        </div>
      )}

      <SavingIndicator active={saving} message="Please hold on while we update the care plan…" />

      {dailyAssignment && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Care plan history
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Day 1 ({dailyAssignment.startDate}) through last day ({dailyAssignment.endDate})
              {adherence ? ` · ${adherence.daysTracked} of ${adherence.totalDays} days tracked` : ''}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {adherence ? (
              <>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-primary/20">
                    <span className="text-xs text-muted-foreground">Total adherence</span>
                    <span className="text-lg font-bold text-primary">{adherence.adherencePercent}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {adherence.totalTasksCompleted} / {adherence.totalTasksPossible} tasks completed
                    · {adherence.totalAbsconded} absconded
                  </div>
                </div>
                {adherence.daySummaries.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                    {adherence.daySummaries.map((day: ChecklistDaySummary) => (
                      <div key={day.date} className="flex flex-col sm:flex-row sm:items-center gap-2 py-1.5 border-b border-border last:border-0 text-xs">
                        <span className="font-medium w-28 shrink-0">{day.date}</span>
                        <span className="text-muted-foreground">{day.completedCount}/{day.totalCount} done</span>
                        {day.abscondedCount > 0 ? (
                          <span className="text-destructive">{day.abscondedCount} absconded</span>
                        ) : day.completed ? (
                          <span className="text-[hsl(142_63%_35%)]">Complete</span>
                        ) : day.date === plan?.todayDate ? (
                          <span>In progress</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">History will appear once the first day is tracked.</p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Assign a daily checklist to begin tracking adherence history.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {createMode && !dailyAssignment ? 'Create care plan' : 'Care Plan'} · {motherId}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create a daily checklist for this mother — items reset at midnight each day
          </p>
        </div>
        {adherence && dailyAssignment && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-primary/20">
            <span className="text-xs text-muted-foreground">Checklist adherence</span>
            <span className="text-sm font-bold text-primary">{adherence.adherencePercent}%</span>
          </div>
        )}
        {!adherence && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-primary/20">
          <span className="text-xs text-muted-foreground">Plan completion</span>
          <span className="text-sm font-bold text-primary">{loading ? '—' : `${overallPct}%`}</span>
        </div>
        )}
      </div>

      {canEdit && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Daily care checklist
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Build checklist items from scratch, set a duration, and assign to this mother.
              Each item unchecks at midnight; missed items are recorded as absconded.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {dailyAssignment && (
              <div className="rounded-lg bg-muted/40 border border-border px-3 py-2 text-xs text-muted-foreground space-y-1">
                <p>
                  Active assignment: {dailyAssignment.startDate} → {dailyAssignment.endDate}
                  {' '}({dailyAssignment.durationDays} days)
                </p>
                <p>Created by {dailyAssignment.createdByName ?? user?.name ?? 'Care team'}</p>
                {plan?.assignmentActive === false && (
                  <p className="text-destructive font-medium">Assignment has ended or not yet started.</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              {builderItems.map((row, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={row.text}
                    onChange={(e) => updateBuilderRow(index, e.target.value)}
                    placeholder={`Checklist item ${index + 1}…`}
                    className="h-9 text-sm flex-1"
                  />
                  {builderItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => removeBuilderRow(index)}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={addBuilderRow}>
                <Plus className="w-3.5 h-3.5" /> Add item
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="duration" className="text-xs font-medium text-foreground">Duration (days)</label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={365}
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="start-date" className="text-xs font-medium text-foreground">Start date</label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <AsyncButton
              size="sm"
              className="h-9 text-xs"
              loading={assigning}
              loadingText="Assigning…"
              onClick={assignDailyChecklist}
            >
              {dailyAssignment ? 'Update & reassign checklist' : 'Assign checklist to mother'}
            </AsyncButton>
          </CardContent>
        </Card>
      )}

      {adherence && adherence.daySummaries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Daily adherence & absconded items</CardTitle>
            <p className="text-xs text-muted-foreground">
              {adherence.totalTasksCompleted} of {adherence.totalTasksPossible} tasks completed
              · {adherence.totalAbsconded} absconded
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {adherence.daySummaries.map((day: ChecklistDaySummary) => (
              <div key={day.date} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b border-border last:border-0">
                <span className="text-xs font-medium w-28 shrink-0">{day.date}</span>
                <span className="text-xs text-muted-foreground">
                  {day.completedCount}/{day.totalCount} done
                </span>
                {day.abscondedCount > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {day.abscondedItems.map((item) => (
                      <Badge key={item.id} variant="outline" className="text-[10px] text-destructive border-destructive/30">
                        Absconded: {item.text}
                      </Badge>
                    ))}
                  </div>
                ) : day.completed ? (
                  <Badge variant="outline" className="text-[10px] text-[hsl(142_63%_35%)] border-[hsl(142_63%_55%)]">
                    All complete
                  </Badge>
                ) : day.date === plan?.todayDate ? (
                  <Badge variant="outline" className="text-[10px]">In progress today</Badge>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!dailyAssignment && canEdit && (
        <p className="text-xs text-muted-foreground">
          No daily checklist assigned yet. Use the form above to create one for this mother.
        </p>
      )}

      {loading ? (
        createMode ? null : <MedCardListSkeleton count={4} />
      ) : !createMode || dailyAssignment ? (
        <div className="space-y-4">
          {sections.map((section) => {
            const done = section.items.filter((i) => i.done).length;
            const pct = section.items.length ? Math.round((done / section.items.length) * 100) : 0;
            const Icon = carePlanIcon(section.iconId);
            const isEditing = editing === section.id;

            return (
              <Card key={section.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">{section.title}</CardTitle>
                        <p className="text-xs text-muted-foreground">Reviewed by {section.reviewedBy}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="w-16 h-1.5" />
                      {canEdit && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditing(isEditing ? null : section.id)}>
                          {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2">
                    {section.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <button
                          type="button"
                          disabled={!canEdit || saving}
                          onClick={() => toggleItem(section.id, idx)}
                          className="mt-0.5 disabled:opacity-40"
                        >
                          {item.done ? <CheckCircle2 className="w-4 h-4 text-[hsl(142_63%_35%)]" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        <p className={cn('text-sm', item.done && 'line-through text-muted-foreground')}>{item.label}</p>
                      </li>
                    ))}
                  </ul>
                  {isEditing && canEdit && (
                    <Button size="sm" className="mt-3 h-8 text-xs gap-1" onClick={() => setEditing(null)}>
                      <Save className="w-3.5 h-3.5" /> Done editing
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        <Link to={`/dashboard/mothers/${motherId}`} className="text-primary hover:underline">View full mother profile →</Link>
      </p>
    </div>
  );
}
