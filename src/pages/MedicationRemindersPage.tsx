import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMedications } from '@/hooks/use-medications';
import { DataSourceBadge } from '@/components/common/DataSourceBadge';
import { MedCardListSkeleton } from '@/components/common/TableSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdherenceBadge } from '@/components/common/Badges';
import { toast } from 'sonner';
import { Pill, CheckCircle2, XCircle, Clock, Info, Plus, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'clinician' | 'mother';

const TODAY_MEDS = [
  { id: 'med1', name: 'Ferrous Sulfate', dosage: '200mg', when: '8:00 AM · After breakfast', instruction: 'Take with water. Avoid dairy products within 2 hours.', taken: true, time: 'Taken at 8:12 AM' },
  { id: 'med2', name: 'Folic Acid', dosage: '400mcg', when: '7:30 AM · With breakfast', instruction: 'Take in the morning.', taken: true, time: 'Taken at 7:45 AM' },
  { id: 'med3', name: 'Ferrous Sulfate (2nd dose)', dosage: '200mg', when: '8:00 PM · After dinner', instruction: 'Take with water. Space 2 hours from calcium.', taken: false, time: 'Due tonight' },
  { id: 'med4', name: 'Calcium Carbonate', dosage: '500mg', when: '9:00 PM · Evening', instruction: 'Take at least 2 hours after iron supplement.', taken: false, time: 'Due tonight' },
  { id: 'med5', name: 'Vitamin D3', dosage: '1000 IU', when: '7:30 AM · With breakfast', instruction: 'Take with a meal containing fat.', taken: true, time: 'Taken at 7:45 AM' },
];

export default function MedicationRemindersPage() {
  const { user } = useAuth();
  const patientId = user?.role === 'mother' ? user.motherId : 'MED-ELR-24018';
  const { medications: MEDICATIONS, source, loading } = useMedications(patientId);
  const [view, setView] = useState<ViewMode>('clinician');
  const [takenState, setTakenState] = useState<Record<string, boolean | 'skipped'>>(
    { med1: true, med2: true, med5: true }
  );

  function markTaken(id: string) {
    setTakenState(prev => ({ ...prev, [id]: true }));
    toast.success('Marked as taken');
  }
  function markSkipped(id: string) {
    setTakenState(prev => ({ ...prev, [id]: 'skipped' }));
    toast.info('Skipped — your nurse will be notified.');
  }

  const takenToday = TODAY_MEDS.filter(m => takenState[m.id] === true).length;
  const adherencePct = Math.round((takenToday / TODAY_MEDS.length) * 100);

  return (
    <div className="space-y-6">
      <div data-tour="medications-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Medication Reminders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {user?.role === 'mother' ? `${user.name} · ${patientId}` : 'All enrolled mothers'}
          </p>
        </div>
        <DataSourceBadge source={source} loading={loading} />
        <div className="flex items-center gap-3">
          <Tabs value={view} onValueChange={v => setView(v as ViewMode)}>
            <TabsList className="h-9">
              <TabsTrigger value="clinician" className="text-xs px-3">Clinician View</TabsTrigger>
              <TabsTrigger value="mother" className="text-xs px-3">Mother View</TabsTrigger>
            </TabsList>
          </Tabs>
          {view === 'clinician' && (
            <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={() => toast.success('Opening medication form')}>
              <Plus className="w-3.5 h-3.5" /> Add Medication
            </Button>
          )}
        </div>
      </div>

      {/* Safety notice */}
      <div className="flex items-start gap-3 bg-secondary px-4 py-3 rounded-lg border border-primary/20">
        <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">All medications are prescribed by authorised clinicians.</span>{' '}
          Reminders are managed by hospital staff. Meds-inn does not prescribe medication automatically.
          Contact your care team before making any changes to your medication schedule.
        </p>
      </div>

      {view === 'clinician' ? (
        /* ── CLINICIAN VIEW ── */
        <div data-tour="medications-adherence" className="space-y-4">
          {loading ? (
            <MedCardListSkeleton count={4} />
          ) : MEDICATIONS.map(med => (
            <Card key={med.id}>
              <CardContent className="pt-5 pb-5">
                <div className="flex flex-col md:flex-row md:items-start gap-5">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground">{med.name}</h3>
                      <Badge variant="outline" className="text-xs">{med.dosage}</Badge>
                      <Badge variant="outline" className="text-xs">{med.frequency}</Badge>
                      <Badge variant="outline" className="text-xs">{med.route}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{med.instructions}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs border-t border-border pt-3">
                      <div><p className="text-muted-foreground">Start date</p><p className="font-medium text-foreground mt-0.5">{med.startDate}</p></div>
                      <div><p className="text-muted-foreground">End date</p><p className="font-medium text-foreground mt-0.5">{med.endDate}</p></div>
                      <div><p className="text-muted-foreground">Prescribed by</p><p className="font-medium text-foreground mt-0.5">{med.prescribedBy}</p></div>
                      <div><p className="text-muted-foreground">Last taken</p><p className="font-medium text-foreground mt-0.5">{med.lastTaken.replace('T', ' ').slice(0, 16)}</p></div>
                    </div>
                    {med.notes && (
                      <div className="flex items-start gap-1.5 mt-3 text-xs text-muted-foreground">
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span className="italic">{med.notes}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                      <AdherenceBadge value={med.adherence} />
                      <p className="text-xs text-muted-foreground mt-0.5">adherence</p>
                    </div>
                    <Progress value={med.adherence} className="w-20 h-1.5" />
                    <p className="text-xs text-muted-foreground">{med.missedDoses} missed doses</p>
                    <Button variant="ghost" size="sm" className="h-7 text-xs mt-1" onClick={() => toast.info('Edit medication')}>Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* ── MOTHER VIEW ── */
        <div className="space-y-6">
          {/* Daily summary */}
          <Card className="border-primary/20 bg-secondary/40">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Today's Adherence</p>
                  <p className="text-xs text-muted-foreground">Thursday, 25 June 2026</p>
                </div>
                <span className="text-3xl font-bold text-primary">{adherencePct}%</span>
              </div>
              <Progress value={adherencePct} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">{takenToday} of {TODAY_MEDS.length} medications taken today</p>
            </CardContent>
          </Card>

          {/* Medication cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {TODAY_MEDS.map(med => {
              const status = takenState[med.id];
              const isTaken = status === true;
              const isSkipped = status === 'skipped';

              return (
                <Card key={med.id} className={cn(
                  isTaken ? 'border-[hsl(142_63%_70%)] bg-[hsl(142_63%_97%)]' :
                  isSkipped ? 'border-muted opacity-70' : 'border-border'
                )}>
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                        isTaken ? 'bg-[hsl(142_63%_88%)]' : 'bg-secondary'
                      )}>
                        <Pill className={cn('w-5 h-5', isTaken ? 'text-[hsl(142_63%_30%)]' : 'text-primary')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground">{med.name}</p>
                          <Badge variant="outline" className="text-xs shrink-0">{med.dosage}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{med.when}</p>
                        <p className="text-xs text-muted-foreground/70 italic mb-3">{med.instruction}</p>

                        {isTaken ? (
                          <div className="flex items-center gap-1.5 text-xs text-[hsl(142_63%_30%)] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {med.time}
                          </div>
                        ) : isSkipped ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <XCircle className="w-3.5 h-3.5" />
                            Skipped — nurse notified
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="h-8 text-xs gap-1.5 flex-1"
                              onClick={() => markTaken(med.id)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Taken
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1.5 flex-1"
                              onClick={() => markSkipped(med.id)}
                            >
                              <XCircle className="w-3.5 h-3.5" /> Skip
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
