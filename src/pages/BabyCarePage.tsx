import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBabyProfile } from '@/hooks/use-baby';
import { useBabyCare } from '@/hooks/use-baby-care';
import { useCareBrief } from '@/hooks/use-care-brief';
import { useAuth } from '@/contexts/AuthContext';
import { useMothers } from '@/hooks/use-mothers';
import { isAssignedToMother } from '@/lib/assignments';
import { CareBriefPanel } from '@/components/clinical/CareBriefPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Baby, Loader2, Save, CheckCircle2, Pill, Activity, ListChecks, Sparkles } from 'lucide-react';
import { BLOOD_GROUPS, BABY_GENDERS } from '@/lib/blood-groups';

const EMPTY_FORM = {
  babyName: '',
  birthDate: '',
  gender: '',
  birthWeight: '',
  currentWeight: '',
  birthLength: '',
  deliveryType: '',
  feedingMethod: '',
  bloodGroup: '',
  apgarScore: '',
  notes: '',
};

function motherStatusLabel(m: { careStage?: string; status?: string }) {
  if (m.careStage === 'postpartum' || m.status === 'postpartum' || m.status === 'delivered') {
    return 'Delivered';
  }
  return 'Pregnant';
}

export default function BabyCarePage() {
  const { user } = useAuth();
  const { mothers, loading: mothersLoading } = useMothers();

  const selectableMothers = useMemo(() => {
    if (user?.role === 'mother') return [];
    if (user?.role === 'admin') return mothers;
    return mothers.filter((m) => isAssignedToMother(user!, m));
  }, [mothers, user]);

  const sortedMothers = useMemo(
    () =>
      [...selectableMothers].sort((a, b) => {
        const aDelivered = motherStatusLabel(a) === 'Delivered' ? 0 : 1;
        const bDelivered = motherStatusLabel(b) === 'Delivered' ? 0 : 1;
        return aDelivered - bDelivered || a.name.localeCompare(b.name);
      }),
    [selectableMothers],
  );

  const [selectedMotherId, setSelectedMotherId] = useState('');
  const effectiveMotherId =
    user?.role === 'mother' ? user.motherId : selectedMotherId || undefined;

  useEffect(() => {
    if (user?.role === 'mother' || selectedMotherId) return;
    if (sortedMothers.length === 1) {
      setSelectedMotherId(sortedMothers[0].id);
    }
  }, [user?.role, selectedMotherId, sortedMothers]);

  const { profile, loading, error, saving, save, canEdit, refetch } =
    useBabyProfile(effectiveMotherId);
  const {
    symptoms,
    medications,
    checklist,
    loading: careLoading,
    saving: careSaving,
    logSymptom,
    addMedication,
    toggleChecklist,
    refetch: refetchCare,
  } = useBabyCare(effectiveMotherId);

  const { brief, canEdit: canEditBrief, loading: briefLoading, busy: briefBusy, regenerate, markReviewed } =
    useCareBrief(user?.role !== 'mother' ? effectiveMotherId : undefined);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('profile');
  const [symptomForm, setSymptomForm] = useState({ symptom: '', severity: 'mild', notes: '' });
  const [medForm, setMedForm] = useState({ name: '', dosage: '', frequency: '', instructions: '' });

  React.useEffect(() => {
    if (profile) {
      setForm({
        babyName: profile.babyName ?? '',
        birthDate: profile.birthDate ?? '',
        gender: profile.gender ?? '',
        birthWeight: profile.birthWeight ?? '',
        currentWeight: profile.currentWeight ?? '',
        birthLength: profile.birthLength ?? '',
        deliveryType: profile.deliveryType ?? '',
        feedingMethod: profile.feedingMethod ?? '',
        bloodGroup: profile.bloodGroup ?? '',
        apgarScore: profile.apgarScore ?? '',
        notes: profile.notes ?? '',
      });
    } else if (canEdit) {
      setForm(EMPTY_FORM);
      setEditing(true);
    }
  }, [profile, canEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.babyName.trim() || !form.birthDate) {
      toast.error('Baby name and birth date are required.');
      return;
    }
    try {
      await save(form);
      toast.success('Baby profile saved');
      setEditing(false);
      refetchCare();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  const showForm = canEdit && (editing || !profile);
  const isClinical = user?.role === 'admin' || user?.role === 'nurse' || user?.role === 'doctor';

  return (
    <div className="space-y-6">
      <div data-tour="baby-care-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Baby Care</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {canEdit
              ? 'Daily baby care tasks, symptoms, medications, and profile.'
              : 'Baby care for mothers who have delivered.'}
          </p>
        </div>
        {user?.role !== 'mother' && (
          <Select value={selectedMotherId} onValueChange={setSelectedMotherId}>
            <SelectTrigger className="w-64 h-9">
              <SelectValue placeholder={mothersLoading ? 'Loading mothers…' : 'Select assigned mother'} />
            </SelectTrigger>
            <SelectContent>
              {sortedMothers.length === 0 ? (
                <SelectItem value="__none" disabled>
                  {mothersLoading ? 'Loading…' : 'No assigned mothers'}
                </SelectItem>
              ) : (
                sortedMothers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} · {motherStatusLabel(m)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error.message}
          <Button variant="link" className="h-auto p-0 ml-2 text-destructive" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {loading && !profile ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : !effectiveMotherId && user?.role !== 'mother' ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {sortedMothers.length === 0
              ? 'No mothers are assigned to you yet. Assign patients from the Mothers page.'
              : 'Select an assigned mother above to view baby care.'}
          </CardContent>
        </Card>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-9 flex-wrap">
            <TabsTrigger value="profile" className="text-xs gap-1"><Baby className="w-3 h-3" />Profile</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs gap-1"><ListChecks className="w-3 h-3" />Daily tasks</TabsTrigger>
            <TabsTrigger value="symptoms" className="text-xs gap-1"><Activity className="w-3 h-3" />Symptoms</TabsTrigger>
            <TabsTrigger value="medications" className="text-xs gap-1"><Pill className="w-3 h-3" />Medications</TabsTrigger>
            {isClinical && (
              <TabsTrigger value="brief" className="text-xs gap-1"><Sparkles className="w-3 h-3" />AI brief</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            {showForm ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Baby className="w-4 h-4" /> {profile ? 'Update baby profile' : "Add your baby's information"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="babyName">Baby&apos;s name *</Label>
                      <Input id="babyName" value={form.babyName} onChange={(e) => setForm((f) => ({ ...f, babyName: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Birth date *</Label>
                      <Input id="birthDate" type="date" value={form.birthDate} onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
                        <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                          {BABY_GENDERS.map((g) => (
                            <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bloodGroup">Blood group</Label>
                      <Select value={form.bloodGroup} onValueChange={(v) => setForm((f) => ({ ...f, bloodGroup: v }))}>
                        <SelectTrigger id="bloodGroup"><SelectValue placeholder="Select blood group" /></SelectTrigger>
                        <SelectContent>
                          {BLOOD_GROUPS.map((bg) => (
                            <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthWeight">Birth weight</Label>
                      <Input id="birthWeight" placeholder="e.g. 3.2 kg" value={form.birthWeight} onChange={(e) => setForm((f) => ({ ...f, birthWeight: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentWeight">Current weight</Label>
                      <Input id="currentWeight" placeholder="e.g. 4.1 kg" value={form.currentWeight} onChange={(e) => setForm((f) => ({ ...f, currentWeight: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryType">Delivery type</Label>
                      <Select value={form.deliveryType} onValueChange={(v) => setForm((f) => ({ ...f, deliveryType: v }))}>
                        <SelectTrigger id="deliveryType"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Vaginal delivery">Vaginal delivery</SelectItem>
                          <SelectItem value="C-section">C-section</SelectItem>
                          <SelectItem value="Assisted delivery">Assisted delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="feedingMethod">Feeding method</Label>
                      <Select value={form.feedingMethod} onValueChange={(v) => setForm((f) => ({ ...f, feedingMethod: v }))}>
                        <SelectTrigger id="feedingMethod"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Breastfeeding">Breastfeeding</SelectItem>
                          <SelectItem value="Formula">Formula</SelectItem>
                          <SelectItem value="Mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="notes">Additional notes</Label>
                      <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <div className="md:col-span-2 flex gap-2">
                      <Button type="submit" disabled={saving} className="gap-1.5">
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : 'Save profile'}
                      </Button>
                      {profile && (
                        <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : profile ? (
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Baby className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <h2 className="text-lg font-bold text-foreground">{profile.babyName}</h2>
                      {canEdit && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEditing(true)}>Edit</Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3 text-sm">
                      {[
                        { label: 'Birth Date', value: profile.birthDate },
                        { label: 'Gender', value: BABY_GENDERS.find((g) => g.value === profile.gender)?.label ?? (profile.gender || '—') },
                        { label: 'Blood Group', value: profile.bloodGroup || '—' },
                        { label: 'Feeding', value: profile.feedingMethod || '—' },
                        { label: 'Birth Weight', value: profile.birthWeight || '—' },
                        { label: 'Current Weight', value: profile.currentWeight || '—' },
                      ].map((item) => (
                        <div key={item.label}>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className="text-sm font-medium text-foreground">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  No baby profile on file yet.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Today&apos;s baby care checklist</CardTitle>
                <p className="text-xs text-muted-foreground">Feeding, medications, tummy time, and daily routines — resets each day.</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {careLoading ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
                ) : checklist.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No tasks loaded.</p>
                ) : (
                  checklist.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!canEdit || careSaving}
                      onClick={() => canEdit && toggleChecklist(item.id)}
                      className="flex items-center gap-3 w-full text-left disabled:opacity-50 py-1"
                    >
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${item.done ? 'text-[hsl(142_63%_35%)]' : 'text-border'}`} />
                      <span className={`text-sm ${item.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.text}</span>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="symptoms" className="mt-4 space-y-4">
            {canEdit && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Log baby symptom</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder="Symptom (e.g. fever, rash)" value={symptomForm.symptom} onChange={(e) => setSymptomForm((f) => ({ ...f, symptom: e.target.value }))} />
                  <Select value={symptomForm.severity} onValueChange={(v) => setSymptomForm((f) => ({ ...f, severity: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="Notes" rows={2} value={symptomForm.notes} onChange={(e) => setSymptomForm((f) => ({ ...f, notes: e.target.value }))} />
                  <Button
                    size="sm"
                    disabled={careSaving || !symptomForm.symptom.trim()}
                    onClick={async () => {
                      await logSymptom(symptomForm);
                      setSymptomForm({ symptom: '', severity: 'mild', notes: '' });
                      toast.success('Symptom logged');
                    }}
                  >
                    Save symptom
                  </Button>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Symptom history</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {symptoms.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No symptoms logged yet.</p>
                ) : (
                  symptoms.map((s) => (
                    <div key={s.id} className="py-2 border-b border-border last:border-0">
                      <p className="text-sm font-medium">{s.symptom} <span className="text-xs text-muted-foreground">({s.severity})</span></p>
                      <p className="text-xs text-muted-foreground">{s.date}{s.notes ? ` · ${s.notes}` : ''}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medications" className="mt-4 space-y-4">
            {isClinical && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Prescribe baby medication</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-3">
                  <Input placeholder="Name (e.g. Vitamin D drops)" value={medForm.name} onChange={(e) => setMedForm((f) => ({ ...f, name: e.target.value }))} />
                  <Input placeholder="Dosage" value={medForm.dosage} onChange={(e) => setMedForm((f) => ({ ...f, dosage: e.target.value }))} />
                  <Input placeholder="Frequency" value={medForm.frequency} onChange={(e) => setMedForm((f) => ({ ...f, frequency: e.target.value }))} />
                  <Input placeholder="Instructions" value={medForm.instructions} onChange={(e) => setMedForm((f) => ({ ...f, instructions: e.target.value }))} />
                  <Button
                    size="sm"
                    className="md:col-span-2 w-fit"
                    disabled={careSaving || !medForm.name.trim()}
                    onClick={async () => {
                      await addMedication(medForm);
                      setMedForm({ name: '', dosage: '', frequency: '', instructions: '' });
                      toast.success('Baby medication added');
                    }}
                  >
                    Add medication
                  </Button>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Baby medications</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {medications.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No baby medications prescribed yet.</p>
                ) : (
                  medications.map((m) => (
                    <div key={m.id} className="py-2 border-b border-border last:border-0">
                      <p className="text-sm font-medium">{m.name} · {m.dosage}</p>
                      <p className="text-xs text-muted-foreground">{m.frequency}{m.instructions ? ` · ${m.instructions}` : ''}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isClinical && (
            <TabsContent value="brief" className="mt-4">
              <CareBriefPanel
                brief={brief}
                loading={briefLoading}
                busy={briefBusy}
                canEdit={canEditBrief}
                onRegenerate={regenerate}
                onMarkReviewed={markReviewed}
                patientId={effectiveMotherId}
              />
            </TabsContent>
          )}
        </Tabs>
      )}

      {user?.role !== 'mother' && effectiveMotherId && !profile && (
        <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
          <Link to={`/dashboard/messages?patientId=${encodeURIComponent(effectiveMotherId)}`}>
            Prompt patient via Messages
          </Link>
        </Button>
      )}
    </div>
  );
}
