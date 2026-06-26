import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Baby, Syringe, TrendingUp, Heart, MessageSquare,
  CheckCircle2, Clock, AlertTriangle, Milk, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VACCINATION_SCHEDULE, GROWTH_MILESTONES } from '@/lib/demo-data';

type Tab = 'profile' | 'vaccinations' | 'milestones' | 'feeding' | 'postpartum' | 'journey';

const NURSE_NOTES = [
  { date: '2026-06-25', nurse: 'Nurse Linda James', note: 'Baby Bello weighed at 6-week check. Weight 4.1kg — good gain since birth. Breastfeeding established. Mother reports fatigue; advised rest and support network.' },
  { date: '2026-05-20', nurse: 'Nurse Esther Okonkwo', note: 'First home visit at 2 weeks. Baby feeding well, umbilical cord healed. Amina recovering. Lochia resolved. No signs of postpartum depression at this time.' },
];

const FIRST_YEAR_JOURNEY = [
  { age: 'Birth', title: 'Delivery & first check', done: true, notes: 'APGAR score 9. Birth weight 3.2kg. Breastfeeding initiated.' },
  { age: '1 week', title: 'First home visit', done: true, notes: 'Nurse home visit. Weight check and feeding assessment.' },
  { age: '2 weeks', title: 'Follow-up visit', done: true, notes: 'Healing well. Weight 3.4kg. Continuing breast milk.' },
  { age: '6 weeks', title: 'Postpartum review', done: true, notes: 'Mother recovering well. Baby 4.1kg. First vaccinations given.' },
  { age: '2 months', title: '2-month immunisations', done: false, notes: 'DTaP, Hib, IPV, PCV, Rotavirus due.' },
  { age: '4 months', title: '4-month immunisations', done: false, notes: 'Second dose of 2-month vaccines due.' },
  { age: '6 months', title: '6-month check', done: false, notes: 'Growth review, introduce solid foods guidance.' },
  { age: '9 months', title: '9-month review', done: false, notes: 'Developmental milestone review.' },
  { age: '12 months', title: 'First birthday check', done: false, notes: 'Full first-year wellness review. Final immunisations.' },
];

export default function BabyCarePage() {
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <div className="space-y-6">
      <div data-tour="baby-care-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Baby Care</h1>
          <p className="text-sm text-muted-foreground mt-0.5">From pregnancy to first vaccinations, all in one care journey.</p>
        </div>
      </div>

      {/* Baby header card */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <Baby className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h2 className="text-lg font-bold text-foreground">Baby Bello</h2>
              <Badge variant="outline" className="text-xs">Age: 10 weeks 4 days</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm">
              {[
                { label: 'Mother', value: 'Amina Bello (MED-ELR-24018)' },
                { label: 'Birth Date', value: 'October 14, 2026' },
                { label: 'Birth Weight', value: '3.2 kg' },
                { label: 'Current Weight', value: '4.1 kg' },
                { label: 'Delivery', value: 'Vaginal delivery' },
                { label: 'Paediatrician', value: 'Dr. Ifeoma Nnaji' },
                { label: 'Assigned Nurse', value: 'Nurse Linda James' },
                { label: 'Next Visit', value: 'Dec 15, 2026 (2-month check)' },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={v => setTab(v as Tab)}>
        <TabsList className="h-9 flex-wrap">
          {[
            { key: 'profile', label: 'Profile' },
            { key: 'vaccinations', label: 'Vaccinations' },
            { key: 'milestones', label: 'Milestones' },
            { key: 'feeding', label: 'Feeding' },
            { key: 'postpartum', label: 'Postpartum' },
            { key: 'journey', label: 'First Year' },
          ].map(t => (
            <TabsTrigger key={t.key} value={t.key} className="text-xs px-3">{t.label}</TabsTrigger>
          ))}
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile" className="mt-4">
          <div data-tour="baby-care-records" className="grid md:grid-cols-3 gap-4">
            {[
              { label: 'Birth Weight', value: '3.2 kg', note: 'Normal range: 2.5–4.0 kg', ok: true },
              { label: 'Current Weight', value: '4.1 kg', note: '+900g since birth · Good progression', ok: true },
              { label: 'Length at Birth', value: '51 cm', note: 'Normal range: 48–52 cm', ok: true },
              { label: 'APGAR Score', value: '9/10', note: 'Recorded at 5 minutes', ok: true },
              { label: 'Feeding Method', value: 'Breastfeeding', note: 'Established at 2 weeks', ok: true },
              { label: 'Blood Group', value: 'O+ (confirmed)', note: 'Matches mother', ok: true },
            ].map(m => (
              <div key={m.label} className="bg-card border border-border rounded-lg p-4 flex flex-col h-full">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{m.value}</p>
                <p className="text-xs text-muted-foreground mt-1 text-pretty">{m.note}</p>
                {m.ok && <CheckCircle2 className="w-4 h-4 text-[hsl(142_63%_35%)] mt-auto pt-2" />}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Vaccinations */}
        <TabsContent value="vaccinations" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Vaccination Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-border">
                      {['Age', 'Vaccine', 'Due Date', 'Given', 'Status'].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-muted-foreground px-3 py-2.5 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {VACCINATION_SCHEDULE.map((v, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-3 text-xs font-medium text-foreground whitespace-nowrap">{v.ageLabel}</td>
                        <td className="px-3 py-3 text-xs text-foreground whitespace-nowrap">{v.vaccine}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{v.dueDate}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{v.givenDate ?? '—'}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            v.status === 'given' ? 'bg-[hsl(142_63%_90%)] text-[hsl(142_63%_25%)]' :
                            v.status === 'due' ? 'bg-[hsl(38_92%_90%)] text-[hsl(38_70%_28%)]' :
                            'bg-muted text-muted-foreground'
                          )}>
                            {v.status === 'given' ? 'Given' : v.status === 'due' ? 'Due soon' : 'Upcoming'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones */}
        <TabsContent value="milestones" className="mt-4">
          <div className="grid md:grid-cols-2 gap-3">
            {GROWTH_MILESTONES.map((m, i) => (
              <div key={i} className={cn('rounded-lg border p-4', m.achieved ? 'border-[hsl(142_63%_70%)] bg-[hsl(142_63%_97%)]' : 'border-border bg-card')}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{m.ageLabel}</p>
                  {m.achieved
                    ? <CheckCircle2 className="w-4 h-4 text-[hsl(142_63%_35%)] shrink-0" />
                    : <Clock className="w-4 h-4 text-muted-foreground shrink-0" />}
                </div>
                <p className="text-sm font-medium text-foreground text-pretty">{m.milestone}</p>
                {m.achieved && m.achievedDate && (
                  <p className="text-xs text-muted-foreground mt-1">Achieved {m.achievedDate}</p>
                )}
                {!m.achieved && <p className="text-xs text-muted-foreground mt-1">Upcoming — expected ~{m.ageLabel}</p>}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Feeding */}
        <TabsContent value="feeding" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Feeding Notes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { date: '2026-06-25', note: 'Breastfeeding every 2.5–3 hours. Baby latching well. Mother reports mild soreness — advised positioning technique.', by: 'Nurse Linda James' },
                { date: '2026-06-05', note: 'Exclusive breastfeeding established at 3 weeks. Baby gaining weight appropriately. No supplemental formula needed.', by: 'Nurse Linda James' },
                { date: '2026-11-01', note: 'Introduction of pureed foods discussed for 6-month check. Breastfeeding to continue alongside solids.', by: 'Dr. Ifeoma Nnaji' },
              ].map((note, i) => (
                <div key={i} className="border-l-2 border-[hsl(207_85%_45%)] pl-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-foreground">{note.by}</span>
                    <span className="text-xs text-muted-foreground">{note.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-pretty leading-relaxed">{note.note}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Postpartum */}
        <TabsContent value="postpartum" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Postpartum Mother Check-ins</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {NURSE_NOTES.map((n, i) => (
                <div key={i} className="border-l-2 border-primary pl-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-foreground">{n.nurse}</span>
                    <span className="text-xs text-muted-foreground">{n.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-pretty leading-relaxed">{n.note}</p>
                </div>
              ))}
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => toast.success('Note added')}>
                <MessageSquare className="w-3.5 h-3.5" /> Add check-in note
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* First year journey */}
        <TabsContent value="journey" className="mt-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">First Year Care Journey</CardTitle></CardHeader>
            <CardContent className="space-y-0">
              {FIRST_YEAR_JOURNEY.map((e, i) => (
                <div key={i} className="flex gap-4 pb-5 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', e.done ? 'bg-primary' : 'bg-muted border-2 border-border')}>
                      {e.done ? <CheckCircle2 className="w-4 h-4 text-primary-foreground" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    {i < FIRST_YEAR_JOURNEY.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
                  </div>
                  <div className="pb-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{e.age}</span>
                      {e.done && <Badge variant="outline" className="text-xs h-4 py-0 text-[hsl(142_63%_30%)] border-[hsl(142_63%_50%)]">Done</Badge>}
                    </div>
                    <p className="text-sm font-medium text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 text-pretty">{e.notes}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
