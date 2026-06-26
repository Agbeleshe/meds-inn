import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  CheckCircle2, Clock, Edit2, ChevronRight, Apple, Droplets,
  Pill, Calendar, Heart, ShieldAlert, Baby, BookOpen, AlertTriangle, Save, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanSection {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  reviewedBy: string;
  reviewDate: string;
  items: { label: string; done: boolean; note?: string }[];
}

const INITIAL_PLAN: PlanSection[] = [
  {
    id: 'trimester-goals',
    icon: Heart,
    title: 'Second Trimester Goals',
    reviewedBy: 'Dr. Tolu Adebayo',
    reviewDate: '2026-06-20',
    items: [
      { label: 'Attend 20-week anomaly scan', done: true, note: 'Completed June 1. No anomalies detected.' },
      { label: 'Complete glucose tolerance test (24–28 weeks)', done: false, note: 'Scheduled — to be completed by July 15.' },
      { label: 'Review haemoglobin at 24-week visit', done: true, note: 'Hb 10.8 g/dL. Iron continued.' },
      { label: 'Discuss birth plan preferences', done: false },
    ],
  },
  {
    id: 'nutrition',
    icon: Apple,
    title: 'Nutrition Guidance',
    reviewedBy: 'Nurse Esther Okonkwo',
    reviewDate: '2026-06-18',
    items: [
      { label: 'Iron-rich foods daily (leafy greens, beans, lean meat)', done: true },
      { label: 'Calcium-rich foods (dairy, fortified plant milk)', done: true },
      { label: 'Avoid raw fish, unpasteurised dairy, deli meats', done: true },
      { label: 'Small, frequent meals to manage nausea and acidity', done: false },
      { label: 'Limit caffeine to under 200mg/day', done: true },
    ],
  },
  {
    id: 'hydration',
    icon: Droplets,
    title: 'Hydration Goals',
    reviewedBy: 'Nurse Esther Okonkwo',
    reviewDate: '2026-06-18',
    items: [
      { label: 'Drink at least 8–10 glasses of water daily', done: false, note: 'Amina reported difficulty reaching this target.' },
      { label: 'Limit sugary drinks and sodas', done: true },
      { label: 'Hydration tracker activated in app', done: true },
    ],
  },
  {
    id: 'supplements',
    icon: Pill,
    title: 'Supplements',
    reviewedBy: 'Dr. Tolu Adebayo',
    reviewDate: '2026-06-20',
    items: [
      { label: 'Folic Acid 400mcg — once daily (morning)', done: true },
      { label: 'Ferrous Sulfate 200mg — twice daily (with meals)', done: true },
      { label: 'Calcium Carbonate 500mg — once daily (evening)', done: true },
      { label: 'Vitamin D3 1000 IU — once daily (with fatty meal)', done: true },
    ],
  },
  {
    id: 'appointments',
    icon: Calendar,
    title: 'Appointment Schedule',
    reviewedBy: 'Dr. Tolu Adebayo',
    reviewDate: '2026-06-20',
    items: [
      { label: '12-week booking visit', done: true },
      { label: '20-week anomaly scan', done: true },
      { label: '24-week routine review', done: true },
      { label: 'Glucose tolerance test (24–28 weeks)', done: false },
      { label: '28-week review and blood count', done: false },
      { label: '32-week growth scan', done: false },
      { label: '36-week presentation check', done: false },
    ],
  },
  {
    id: 'counselling',
    icon: BookOpen,
    title: 'Counselling & Education Tasks',
    reviewedBy: 'Nurse Esther Okonkwo',
    reviewDate: '2026-06-18',
    items: [
      { label: 'Labour and delivery education session', done: false, note: 'Scheduled for 30-week visit.' },
      { label: 'Breastfeeding preparation session', done: false },
      { label: 'Mental health wellbeing check-in completed', done: true },
      { label: 'Partner included in care plan discussion', done: true },
    ],
  },
  {
    id: 'risk',
    icon: ShieldAlert,
    title: 'Risk Monitoring',
    reviewedBy: 'Dr. Tolu Adebayo',
    reviewDate: '2026-06-20',
    items: [
      { label: 'Blood pressure checked at every visit', done: true },
      { label: 'Anaemia — monitor haemoglobin at 28 weeks', done: false },
      { label: 'Symptom log reviewed by nurse weekly', done: true },
      { label: 'Dizziness and fatigue — active monitoring', done: false, note: 'Nurse follow-up call to be completed.' },
    ],
  },
  {
    id: 'postpartum',
    icon: Heart,
    title: 'Postpartum Plan',
    reviewedBy: 'Dr. Tolu Adebayo',
    reviewDate: '2026-06-20',
    items: [
      { label: '6-week postpartum review booked (Dr. Ifeoma Nnaji)', done: false },
      { label: 'Mental health screening included at 6-week visit', done: false },
      { label: 'Breastfeeding support line shared', done: true },
      { label: 'Contraception options discussed post-delivery', done: false },
    ],
  },
  {
    id: 'baby-prep',
    icon: Baby,
    title: 'Baby Care Preparation',
    reviewedBy: 'Nurse Esther Okonkwo',
    reviewDate: '2026-06-18',
    items: [
      { label: 'Baby profile created on Meds-inn', done: false, note: 'Will activate post-delivery.' },
      { label: 'First-year vaccination schedule prepared', done: true },
      { label: 'Paediatric assignment — Dr. Ifeoma Nnaji', done: true },
      { label: 'Hospital tour scheduled', done: false },
      { label: 'Emergency contact form completed', done: true },
    ],
  },
];

export default function CarePlansPage() {
  const [plan, setPlan] = useState(INITIAL_PLAN);
  const [editing, setEditing] = useState<string | null>(null);

  function toggleItem(sectionId: string, itemIdx: number) {
    setPlan(prev => prev.map(s =>
      s.id === sectionId
        ? { ...s, items: s.items.map((item, i) => i === itemIdx ? { ...item, done: !item.done } : item) }
        : s
    ));
    toast.success('Care plan updated');
  }

  function getCompletion(section: PlanSection) {
    const done = section.items.filter(i => i.done).length;
    return { done, total: section.items.length, pct: Math.round((done / section.items.length) * 100) };
  }

  const totalItems = plan.flatMap(s => s.items).length;
  const completedItems = plan.flatMap(s => s.items).filter(i => i.done).length;
  const overallPct = Math.round((completedItems / totalItems) * 100);

  return (
    <div className="space-y-6">
      <div data-tour="care-plans-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Care Plan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Amina Bello · MED-ELR-24018 · Second Trimester, 24 weeks</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-primary/20">
            <span className="text-xs text-muted-foreground">Overall completion</span>
            <span className="text-sm font-bold text-primary">{overallPct}%</span>
          </div>
          <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5" onClick={() => toast.success('Review requested')}>
            <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" /> Request review
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg border border-border">
        Care plans are reviewed and managed by hospital staff. All changes require clinician approval. Medication schedules are not automatically generated.
      </p>

      <div data-tour="care-plans-list" className="space-y-4">
        {plan.map(section => {
          const { done, total, pct } = getCompletion(section);
          const Icon = section.icon;
          const isEditing = editing === section.id;

          return (
            <Card key={section.id} className={cn(pct === 100 ? 'border-[hsl(142_63%_70%)] opacity-90' : '')}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{section.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Reviewed by {section.reviewedBy} · {section.reviewDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{done}/{total}</span>
                      <Progress value={pct} className="w-16 h-1.5" />
                      <span>{pct}%</span>
                    </div>
                    {pct === 100 && <CheckCircle2 className="w-4 h-4 text-[hsl(142_63%_35%)]" />}
                    <Button
                      variant="ghost" size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setEditing(isEditing ? null : section.id)}
                    >
                      {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {section.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <button
                        onClick={() => toggleItem(section.id, idx)}
                        className="mt-0.5 shrink-0 transition-colors"
                      >
                        {item.done
                          ? <CheckCircle2 className="w-4 h-4 text-[hsl(142_63%_35%)]" />
                          : <Clock className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', item.done ? 'line-through text-muted-foreground' : 'text-foreground')}>
                          {item.label}
                        </p>
                        {item.note && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5 italic">{item.note}</p>
                        )}
                      </div>
                      {isEditing && (
                        <Badge variant="outline" className="text-xs shrink-0">{item.done ? 'Done' : 'Pending'}</Badge>
                      )}
                    </li>
                  ))}
                </ul>
                {isEditing && (
                  <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
                    <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => { setEditing(null); toast.success('Section saved'); }}>
                      <Save className="w-3.5 h-3.5" /> Save changes
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEditing(null)}>Cancel</Button>
                    <span className="text-xs text-muted-foreground ml-auto">Changes require clinician review.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
